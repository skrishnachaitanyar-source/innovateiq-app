import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function seniorityLabel(level: string) {
  const map: Record<string, string> = {
    junior: 'Junior (0–2 yrs)',
    mid: 'Mid-Level (2–5 yrs)',
    senior: 'Senior (5–10 yrs)',
    principal: 'Principal / Lead (10+ yrs)',
    open: 'Open / Flexible',
  }
  return map[level] || level
}

export function engagementLabel(type: string) {
  const map: Record<string, string> = {
    w2: 'W-2 (via Staffing Agency)',
    '1099': '1099 Independent Contractor',
    c2c: 'Corp-to-Corp (C2C)',
    open: 'Open / Flexible',
  }
  return map[type] || type
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-purple-100 text-purple-800',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
    new: 'bg-blue-100 text-blue-800',
    filled: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
