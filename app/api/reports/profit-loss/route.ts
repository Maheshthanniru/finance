import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const transactions = await getTransactions()
    const filtered = transactions.filter(t => {
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      return true
    })

    // Income accounts
    const incomeAccounts = ['CD COMMISSION', 'Document Charges', 'JEEVANI JHOTHI', 'PENALTY CD', 'STBD Commission', 'STBD DOCUMENT CHARGES', 'STBD PENALTY']
    const incomes = incomeAccounts.map(name => ({
      accountName: name,
      amount: filtered
        .filter(t => t.accountName.toUpperCase().includes(name.toUpperCase()))
        .reduce((sum, t) => sum + t.credit - t.debit, 0),
    })).filter(i => i.amount > 0)

    // Expense accounts
    const expenseAccounts = ['EXPENCES', 'EXPENCES A/C', 'EXPENCES A/C OUT', 'INTEREST A/C', 'NPA A/C']
    const expenses = expenseAccounts.map(name => ({
      accountName: name,
      amount: filtered
        .filter(t => t.accountName.toUpperCase().includes(name.toUpperCase()))
        .reduce((sum, t) => sum + t.debit - t.credit, 0),
    })).filter(e => e.amount > 0)

    const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalProfit = totalIncomes - totalExpenses
    const shareValue = totalProfit * 0.3 // 30% share value
    const eachPartnerProfit = totalProfit / 4 // Assuming 4 partners

    return NextResponse.json({
      incomes,
      expenses,
      totalIncomes,
      totalExpenses,
      totalProfit,
      shareValue,
      eachPartnerProfit,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profit and loss' }, { status: 500 })
  }
}

