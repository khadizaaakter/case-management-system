import { api } from "./client"
import type { depots } from './types'


export async function listDeports(): Promise<depots[]> {
    const res = await api<{ depots: depots[]}>('/depots')
    return res.depots
}