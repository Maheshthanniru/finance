import { Loan, Transaction, Partner, DailyReport, DayBookEntry } from '@/types';
import { supabase } from './supabase';

// Helper function to convert database loan to Loan type
function mapLoanFromDb(dbLoan: any): Loan {
  return {
    id: dbLoan.id,
    number: dbLoan.number,
    date: dbLoan.date,
    loanType: dbLoan.loan_type,
    customerName: dbLoan.customer_name,
    fatherName: dbLoan.father_name,
    aadhaar: dbLoan.aadhaar,
    cNo: dbLoan.c_no,
    address: dbLoan.address,
    phone1: dbLoan.phone1,
    phone2: dbLoan.phone2,
    guarantor1: dbLoan.guarantor1_name ? {
      name: dbLoan.guarantor1_name,
      aadhaar: dbLoan.guarantor1_aadhaar,
      phone: dbLoan.guarantor1_phone,
    } : undefined,
    guarantor2: dbLoan.guarantor2_name ? {
      name: dbLoan.guarantor2_name,
      aadhaar: dbLoan.guarantor2_aadhaar,
      phone: dbLoan.guarantor2_phone,
    } : undefined,
    particulars: dbLoan.particulars,
    loanAmount: parseFloat(dbLoan.loan_amount),
    rateOfInterest: dbLoan.rate_of_interest ? parseFloat(dbLoan.rate_of_interest) : undefined,
    period: dbLoan.period,
    documentCharges: dbLoan.document_charges ? parseFloat(dbLoan.document_charges) : undefined,
    partnerId: dbLoan.partner_id,
    partnerName: dbLoan.partner_name,
    userName: dbLoan.user_name,
    entryTime: dbLoan.entry_time,
  };
}

// Helper function to convert Loan type to database format
function mapLoanToDb(loan: Loan): any {
  return {
    id: loan.id,
    number: loan.number,
    date: loan.date,
    loan_type: loan.loanType,
    customer_name: loan.customerName,
    father_name: loan.fatherName || null,
    aadhaar: loan.aadhaar || null,
    c_no: loan.cNo || null,
    address: loan.address,
    phone1: loan.phone1 || null,
    phone2: loan.phone2 || null,
    guarantor1_name: loan.guarantor1?.name || null,
    guarantor1_aadhaar: loan.guarantor1?.aadhaar || null,
    guarantor1_phone: loan.guarantor1?.phone || null,
    guarantor2_name: loan.guarantor2?.name || null,
    guarantor2_aadhaar: loan.guarantor2?.aadhaar || null,
    guarantor2_phone: loan.guarantor2?.phone || null,
    particulars: loan.particulars || null,
    loan_amount: loan.loanAmount,
    rate_of_interest: loan.rateOfInterest || null,
    period: loan.period,
    document_charges: loan.documentCharges || null,
    partner_id: loan.partnerId || null,
    partner_name: loan.partnerName || null,
    user_name: loan.userName,
    entry_time: loan.entryTime,
  };
}

// Helper function to convert database transaction to Transaction type
function mapTransactionFromDb(dbTransaction: any): Transaction {
  return {
    id: dbTransaction.id,
    date: dbTransaction.date,
    accountName: dbTransaction.account_name,
    particulars: dbTransaction.particulars,
    rno: dbTransaction.rno,
    number: dbTransaction.number,
    credit: parseFloat(dbTransaction.credit),
    debit: parseFloat(dbTransaction.debit),
    userName: dbTransaction.user_name,
    entryTime: dbTransaction.entry_time,
  };
}

// Helper function to convert Transaction type to database format
function mapTransactionToDb(transaction: Transaction): any {
  return {
    id: transaction.id,
    date: transaction.date,
    account_name: transaction.accountName,
    particulars: transaction.particulars,
    rno: transaction.rno || null,
    number: transaction.number || null,
    credit: transaction.credit,
    debit: transaction.debit,
    user_name: transaction.userName,
    entry_time: transaction.entryTime,
  };
}

export async function getLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapLoanFromDb);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
  }
}

export async function saveLoan(loan: Loan): Promise<void> {
  try {
    const loanData = mapLoanToDb(loan);
    
    const { error } = await supabase
      .from('loans')
      .upsert(loanData, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving loan:', error);
    throw error;
  }
}

export async function deleteLoan(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('loans')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .order('entry_time', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransactionFromDb);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  try {
    const transactionData = mapTransactionToDb(transaction);
    
    const { error } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      address: p.address,
    }));
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
}

export async function savePartner(partner: Partner): Promise<void> {
  try {
    const partnerData = {
      id: partner.id,
      name: partner.name,
      phone: partner.phone || null,
      address: partner.address || null,
    };
    
    const { error } = await supabase
      .from('partners')
      .upsert(partnerData, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving partner:', error);
    throw error;
  }
}

export async function getDailyReport(date: string): Promise<DailyReport> {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('date', date)
      .eq('is_deleted', false)
      .order('entry_time', { ascending: true });

    if (error) throw error;

    const transactionList = (transactions || []).map(mapTransactionFromDb);
    
    const accountSummary: { [key: string]: { credit: number; debit: number } } = {};
    
    transactionList.forEach(t => {
      if (!accountSummary[t.accountName]) {
        accountSummary[t.accountName] = { credit: 0, debit: 0 };
      }
      accountSummary[t.accountName].credit += t.credit;
      accountSummary[t.accountName].debit += t.debit;
    });

    const creditTotal = transactionList.reduce((sum, t) => sum + t.credit, 0);
    const debitTotal = transactionList.reduce((sum, t) => sum + t.debit, 0);

    // Calculate opening balance (sum of all previous transactions)
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_deleted', false)
      .order('date', { ascending: true })
      .order('entry_time', { ascending: true });

    const allTransactionList = (allTransactions || []).map(mapTransactionFromDb);
    const previousTransactions = allTransactionList.filter(t => t.date < date);
    const openingBalance = previousTransactions.reduce((sum, t) => sum + t.credit - t.debit, 0);

    const closingBalance = openingBalance + creditTotal - debitTotal;
    const grandTotal = closingBalance;

    return {
      date,
      transactions: transactionList,
      accountSummary: Object.entries(accountSummary).map(([accountName, totals]) => ({
        accountName,
        credit: totals.credit,
        debit: totals.debit,
      })),
      creditTotal,
      debitTotal,
      openingBalance,
      closingBalance,
      grandTotal,
    };
  } catch (error) {
    console.error('Error fetching daily report:', error);
    throw error;
  }
}

export async function getDayBook(date: string): Promise<DayBookEntry[]> {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('date', date)
      .eq('is_deleted', false)
      .order('entry_time', { ascending: true });

    if (error) throw error;

    return (transactions || []).map((t: any, index: number) => ({
      sn: index + 1,
      headOfAccount: t.account_name,
      particulars: t.particulars,
      number: t.number || t.rno,
      credit: parseFloat(t.credit),
      debit: parseFloat(t.debit),
    }));
  } catch (error) {
    console.error('Error fetching day book:', error);
    return [];
  }
}
