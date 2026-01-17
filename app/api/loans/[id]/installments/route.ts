import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'
import { Installment } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loans = await getLoans()
    const loan = loans.find(l => l.id === params.id)
    
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }
    
    // First, try to fetch installments from database
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    
    try {
      const { data: dbInstallments, error: fetchError } = await supabase
        .from('installments')
        .select('*')
        .eq('loan_id', params.id)
        .order('sn', { ascending: true })
      
      // If installments exist in database, return them
      if (!fetchError && dbInstallments && dbInstallments.length > 0) {
        const installments: Installment[] = dbInstallments.map((inst: any) => ({
          sn: inst.sn,
          dueDate: inst.due_date ? inst.due_date.split('T')[0] : '',
          installmentAmount: parseFloat(inst.installment_amount || 0),
          paidAmount: parseFloat(inst.paid_amount || 0),
          dueAmount: parseFloat(inst.due_amount || 0),
          paidDate: inst.paid_date ? inst.paid_date.split('T')[0] : undefined,
          dueDays: inst.due_days || 0,
          penalty: parseFloat(inst.penalty || 0),
        }))
        return NextResponse.json(installments)
      }
    } catch (dbError) {
      console.warn('Error fetching installments from database, will generate:', dbError)
      // Continue to generate installments if database fetch fails
    }
    
    // Otherwise, generate installments based on loan details
    const installments: Installment[] = []
    if (loan.loanType === 'STBD' || loan.loanType === 'HP') {
      // For STBD loans, use installmentAmount and totalInstallments if available
      let installmentAmount = 0
      let totalInstallments = 0
      
      if (loan.loanType === 'STBD') {
        // STBD specific fields
        const stbdLoan = loan as any
        installmentAmount = stbdLoan.installmentAmount || (loan.loanAmount || 0) / (loan.period || 1)
        totalInstallments = stbdLoan.totalInstallments || loan.period || 12
      } else {
        // HP loans
        installmentAmount = (loan.loanAmount || 0) / (loan.period || 1)
        totalInstallments = loan.period || 12
      }
      
      // Use loanDate for STBD, or date for general loans
      const loanDateStr = (loan as any).loanDate || loan.date
      // Handle date string - if it already includes time, use as-is, otherwise add time
      const dateStr = loanDateStr.includes('T') ? loanDateStr : loanDateStr + 'T00:00:00'
      const loanDate = new Date(dateStr)
      
      // Validate loan date
      if (isNaN(loanDate.getTime())) {
        console.error('Invalid loan date:', loanDateStr)
        return NextResponse.json({ error: `Invalid loan date: ${loanDateStr}` }, { status: 400 })
      }
      
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(loanDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        
        installments.push({
          sn: i + 1,
          dueDate: dueDate.toISOString().split('T')[0],
          installmentAmount,
          paidAmount: 0,
          dueAmount: installmentAmount,
          paidDate: undefined,
          dueDays: 0,
          penalty: 0,
        })
      }
      
      // Optionally save generated installments to database for future reference
      // Use upsert to avoid duplicates (UNIQUE constraint on loan_id, sn)
      // This is done asynchronously, don't wait for it
      if (installments.length > 0) {
        supabase.from('installments').upsert(
          installments.map(inst => ({
            loan_id: params.id,
            sn: inst.sn,
            due_date: inst.dueDate,
            installment_amount: inst.installmentAmount,
            paid_amount: inst.paidAmount,
            due_amount: inst.dueAmount,
            paid_date: inst.paidDate || null,
            due_days: inst.dueDays,
            penalty: inst.penalty,
          })),
          { onConflict: 'loan_id,sn' }
        ).then(({ error }: { error: any }) => {
          if (error) {
            console.error('Error saving installments:', error)
          }
        })
      }
    }
    
    return NextResponse.json(installments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 })
  }
}

