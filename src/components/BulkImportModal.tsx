import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { createCase, type CreateCasePayload } from '../api/cases'
import { listLawyers } from '../api/lawyers'
import { getErrorMessage } from '../api/client'

// Must match the header row of public/bulk_case_upload_template.xlsx
const COLUMNS: { header: string; required: boolean }[] = [
  { header: 'business_id', required: true },
  { header: 'customer_code', required: true },
  { header: 'depotCode', required: true },
  { header: 'accused_name', required: true },
  { header: 'accused_address', required: false },
  { header: 'petitioner_name', required: false },
  { header: 'lawyer_id', required: false },
  { header: 'case_number', required: false },
  { header: 'section', required: false },
  { header: 'court_id', required: false },
  { header: 'case_filing_date', required: false },
  { header: 'cheque_amount', required: false },
  { header: 'remarks', required: false },
  { header: 'is_case_filed', required: false },
  { header: 'judgement_details', required: false },
  { header: 'previous_hearing_date', required: false },
  { header: 'next_hearing_date', required: false },
  { header: 'status_id', required: true },
  { header: 'legal_notice_served_date', required: false },
  { header: 'contact_phone', required: false },
  { header: 'contact_email', required: false },
  { header: 'guarantor_name', required: false },
  { header: 'dues_at_filing', required: false },
  { header: 'dues_at_25th_previous_month', required: false },
  { header: 'dues_at_25th_current_month', required: false },
  { header: 'recovered_notice_to_date', required: false },
  { header: 'total_recovered_amount', required: false },
  { header: 'present_dues', required: false },
]

type UploadState = 'idle' | 'parsing' | 'parsed' | 'submitting' | 'success' | 'error'

interface ParseResult {
  fileName: string
  totalRows: number
  validRows: number
  errors: string[]
}

/** One data row from the sheet, keyed by header, plus its row number in Excel. */
type SheetRow = { rowNumber: number; values: Record<string, unknown> }

/** Excel cells may hold Date objects (cellDates), numbers or text — normalise to YYYY-MM-DD. */
function toDate(value: unknown): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  return String(value).trim()
}

function rowToPayload(values: Record<string, unknown>, lawyerNames: Map<string, string>): CreateCasePayload {
  const str = (k: string) => (values[k] === undefined || values[k] === null ? '' : String(values[k]).trim())
  const num = (k: string) => Number(str(k).replace(/,/g, '') || 0)
  const bool = (k: string) => ['1', 'true', 'yes', 'y'].includes(str(k).toLowerCase())

  // The template has lawyer_id, but POST /cases takes lawyer_name (same as the Create Case form).
  const lawyer = str('lawyer_id')

  return {
    business_id: str('business_id'),
    customer_code: str('customer_code'),
    depot_id: str('depotCode'),
    accused_name: str('accused_name'),
    accused_address: str('accused_address'),
    petitioner_name: str('petitioner_name'),
    lawyer_name: lawyerNames.get(lawyer) ?? lawyer,
    case_number: str('case_number'),
    section: str('section'),
    court_id: num('court_id'),
    is_case_filed: str('is_case_filed') ? bool('is_case_filed') : Boolean(str('case_number') || str('court_id') || str('case_filing_date')),
    case_filing_date: toDate(values.case_filing_date) ?? '',
    cheque_amount: num('cheque_amount'),
    remarks: str('remarks'),
    dues_at_filing: num('dues_at_filing'),
    dues_at_25th_previous_month: num('dues_at_25th_previous_month'),
    dues_at_25th_current_month: num('dues_at_25th_current_month'),
    status_id: num('status_id'),
    previous_hearing_date: toDate(values.previous_hearing_date),
    next_hearing_date: toDate(values.next_hearing_date),
    legal_notice_served_date: toDate(values.legal_notice_served_date),
    contact_phone: str('contact_phone'),
    contact_email: str('contact_email'),
    guarantor_name: str('guarantor_name'),
  }
}

function downloadSampleExcel() {
  const link = document.createElement('a')
  link.href = `${import.meta.env.BASE_URL}bulk_case_upload_template.xlsx`
  link.download = 'bulk_case_upload_template.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export default function BulkImportModal({ onClose }: { onClose: () => void }) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [rows, setRows] = useState<SheetRow[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setUploadState('parsing')
    setParseResult(null)
    setSubmitResult(null)
    setRows([])

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][]

      if (jsonData.length < 2) {
        setParseResult({ fileName: file.name, totalRows: 0, validRows: 0, errors: ['File is empty or has no data rows.'] })
        setUploadState('error')
        return
      }

      const headerRow = jsonData[0].map((h) => String(h ?? '').trim())
      const missingHeaders = COLUMNS.filter((c) => c.required && !headerRow.includes(c.header)).map((c) => c.header)

      if (missingHeaders.length > 0) {
        setParseResult({
          fileName: file.name,
          totalRows: 0,
          validRows: 0,
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
        })
        setUploadState('error')
        return
      }

      // Keep each row's original Excel row number so errors point at the right line.
      const numbered = jsonData
        .slice(1)
        .map((row, i) => ({ row, rowNumber: i + 2 }))
        .filter(({ row }) => row.some((cell) => cell !== '' && cell !== null && cell !== undefined))
      const dataRows = numbered.map(({ row }) => row)

      setRows(
        numbered.map(({ row, rowNumber }) => ({
          rowNumber,
          values: Object.fromEntries(headerRow.map((h, idx) => [h, row[idx]])),
        })),
      )

      const errors: string[] = []
      // Look up each required column by its position in the uploaded file, not in COLUMNS
      const requiredIndices = COLUMNS.filter((c) => c.required).map((c) => ({ index: headerRow.indexOf(c.header), header: c.header }))

      dataRows.forEach((row, i) => {
        requiredIndices.forEach(({ index, header }) => {
          const value = row[index]
          if (value === undefined || value === null || String(value).trim() === '') {
            errors.push(`Row ${numbered[i].rowNumber}: "${header}" is required but empty.`)
          }
        })
      })

      setParseResult({
        fileName: file.name,
        totalRows: dataRows.length,
        validRows: errors.length === 0 ? dataRows.length : dataRows.length,
        errors,
      })

      setUploadState(errors.length > 0 ? 'error' : 'parsed')
    } catch {
      setParseResult({ fileName: file.name, totalRows: 0, validRows: 0, errors: ['Failed to parse Excel file. Please check the file format.'] })
      setUploadState('error')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    setUploadState('submitting')

    // Map lawyer ids from the sheet to names, since POST /cases expects lawyer_name.
    const lawyerNames = new Map<string, string>()
    try {
      const lawyers = await listLawyers()
      lawyers.forEach((l) => lawyerNames.set(String(l.id), l.name))
    } catch {
      // Fall back to sending the sheet value as-is.
    }

    // No bulk endpoint exists, so create cases one at a time via POST /cases.
    const failures: string[] = []
    for (const { rowNumber, values } of rows) {
      try {
        await createCase(rowToPayload(values, lawyerNames))
      } catch (err) {
        failures.push(`Row ${rowNumber}: ${getErrorMessage(err)}`)
      }
    }

    const imported = rows.length - failures.length
    if (failures.length === 0) {
      setSubmitResult({ success: true, message: `${imported} cases imported successfully.` })
      setUploadState('success')
    } else {
      setSubmitResult({ success: false, message: `${imported} of ${rows.length} cases imported.` })
      setParseResult((prev) => ({
        fileName: prev?.fileName ?? fileName,
        totalRows: rows.length,
        validRows: imported,
        errors: [
          `${imported} of ${rows.length} cases were saved. ${failures.length} failed — fix these rows and re-upload only them (re-uploading the saved rows would create duplicates).`,
          ...failures,
        ],
      }))
      setUploadState('error')
    }
  }, [rows, fileName])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, [])

  const resetUpload = useCallback(() => {
    setUploadState('idle')
    setFileName('')
    setParseResult(null)
    setSubmitResult(null)
    setRows([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const isReadyToSubmit = uploadState === 'parsed' && parseResult && parseResult.errors.length === 0

  return (
    <Modal title="Bulk Import Cases" onClose={onClose} maxWidth={640}>
      <div className="flex flex-col gap-5">
        <p className="text-[13px] text-muted">
          Upload an Excel file to create multiple cases at once. Download the template first to ensure correct formatting.
        </p>

        {/* Download Template Button */}
        <button type="button" className="btn-ghost self-start" onClick={downloadSampleExcel}>
          <Download size={15} /> Download Sample Excel
        </button>

        {/* Upload Area */}
        <div
          className={`relative flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition ${
            uploadState === 'parsing'
              ? 'border-accent bg-accent-soft'
              : uploadState === 'parsed'
                ? 'border-green-400 bg-green-50'
                : uploadState === 'error' && !parseResult?.errors?.[0]?.includes('Missing required columns')
                  ? 'border-red-300 bg-red-50'
                  : 'border-border-strong bg-bg hover:border-accent hover:bg-accent-soft'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileSelect}
            disabled={uploadState === 'submitting'}
          />

          {uploadState === 'idle' && (
            <>
              <Upload size={32} className="text-faint" />
              <div className="text-sm font-medium text-ink">Click to upload or drag & drop</div>
              <div className="text-xs text-muted">.xlsx or .xls files only</div>
            </>
          )}

          {uploadState === 'parsing' && (
            <>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <div className="text-sm font-medium text-ink">Parsing {fileName}...</div>
            </>
          )}

          {uploadState === 'parsed' && (
            <>
              <CheckCircle2 size={28} className="text-green-500" />
              <div className="text-sm font-medium text-ink">{fileName}</div>
              <div className="text-xs text-green-600">{parseResult?.totalRows} rows ready to import</div>
            </>
          )}

          {uploadState === 'submitting' && (
            <>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <div className="text-sm font-medium text-ink">Importing cases...</div>
            </>
          )}

          {uploadState === 'success' && submitResult && (
            <>
              <CheckCircle2 size={28} className="text-green-500" />
              <div className="text-sm font-medium text-green-700">{submitResult.message}</div>
            </>
          )}

          {uploadState === 'error' && parseResult?.errors?.[0]?.includes('Missing required columns') && (
            <>
              <Upload size={32} className="text-faint" />
              <div className="text-sm font-medium text-ink">Click to upload or drag & drop</div>
              <div className="text-xs text-muted">.xlsx or .xls files only</div>
            </>
          )}
        </div>

        {/* Validation Errors */}
        {uploadState === 'error' && parseResult?.errors && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
              <AlertCircle size={14} /> Validation Errors
            </div>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-[12px] text-red-600">
              {parseResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={uploadState === 'idle' || uploadState === 'success' || uploadState === 'error' ? onClose : resetUpload}
          >
            {uploadState === 'idle' || uploadState === 'success' || uploadState === 'error' ? 'Close' : 'Clear Selection'}
          </button>

          {uploadState === 'success' ? (
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={!isReadyToSubmit && uploadState !== 'submitting'}
              onClick={handleSubmit}
            >
              {uploadState === 'submitting' ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={15} /> Import Cases
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
