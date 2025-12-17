export type LoanType = 'CD' | 'HP' | 'STBD' | 'TBD' | 'FD' | 'OD' | 'RD';

export interface Loan {
  id: string;
  number: number;
  date: string;
  loanType: LoanType;
  customerName: string;
  fatherName?: string;
  aadhaar?: string;
  cNo?: string;
  address: string;
  phone1?: string;
  phone2?: string;
  guarantor1?: {
    name: string;
    aadhaar?: string;
    phone?: string;
  };
  guarantor2?: {
    name: string;
    aadhaar?: string;
    phone?: string;
  };
  particulars?: string;
  loanAmount: number;
  rateOfInterest?: number;
  period: number; // in days
  documentCharges?: number;
  partnerId?: string;
  partnerName?: string;
  userName: string;
  entryTime: string;
  // Image URLs from Supabase Storage
  customerImageUrl?: string;
  guarantor1ImageUrl?: string;
  guarantor2ImageUrl?: string;
  partnerImageUrl?: string;
}

export interface Transaction {
  id: string;
  date: string;
  accountName: string;
  particulars: string;
  rno?: string;
  number?: string;
  credit: number;
  debit: number;
  userName: string;
  entryTime: string;
}

export interface Partner {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface AccountSummary {
  accountName: string;
  credit: number;
  debit: number;
}

export interface DailyReport {
  date: string;
  transactions: Transaction[];
  accountSummary: AccountSummary[];
  creditTotal: number;
  debitTotal: number;
  openingBalance: number;
  closingBalance: number;
  grandTotal: number;
}

export interface DayBookEntry {
  sn: number;
  headOfAccount: string;
  particulars: string;
  number?: string;
  credit: number;
  debit: number;
}

export interface Installment {
  sn: number;
  dueDate: string;
  installmentAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidDate?: string;
  dueDays: number;
  penalty: number;
}

export interface LedgerTransaction {
  date: string;
  credit: number;
  debit: number;
  particulars?: string;
  rno?: string;
}

export interface CDLoan extends Loan {
  receiptNo?: number;
  rate?: number;
  amountPaid?: number;
  presentInterest?: number;
  totalBalance?: number;
  documentStatus?: string;
  documentType?: string;
  loanDate?: string;
  dueDate?: string;
  dueDays?: number;
  nextDueDate?: string;
  penalty?: number;
  totalAmtForRenewal?: number;
  totalAmtForClose?: number;
  documentReturned?: boolean;
}

export interface STBDLoan extends Loan {
  accountNumber?: number;
  instPayingReceiptNo?: number;
  installmentAmount?: number;
  totalInstallments?: number;
  loanDate?: string;
  lastDate?: string;
  dueDate?: string;
  totalAmount?: number;
  lateFees?: number;
  totalPayable?: number;
  installments?: Installment[];
}

export interface TBDLoan extends Loan {
  accountNumber?: number;
  premium?: number;
  premiumDays?: number;
  paidAmount?: number;
  paidDays?: number;
  dueAmount?: number;
  totalDays?: number;
  dueDays?: number;
  joinedDate?: string;
  dueDate?: string;
}

export interface NPALoan {
  id: string;
  date: string;
  number: string;
  name: string;
  npaAmount: number;
  aadhaar?: string;
  phone?: string;
  isNPA: boolean;
  npaDate?: string;
  loanType: LoanType;
  partnerName?: string;
}

export interface BusinessSummary {
  partnerName: string;
  totalLoan: number;
  totalPaid: number;
  balanceWith: number;
  actualLoan: number;
  actualPaid: number;
  balanceWithout: number;
}

export interface LoanSearchResult {
  runningLoans: Loan[];
  asGuarantor1: Loan[];
  asGuarantor2: Loan[];
  allLoans: Loan[];
}

