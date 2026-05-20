/**
 * Bank Info Validation Helpers for VietQR
 * Theo chuẩn của backend Laravel validation
 */

export interface BankValidationRules {
  bank_id: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
  account_no: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
  account_name: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
}

export const bankValidationRules: BankValidationRules = {
  // Bank ID: Phải 6 số (BIN code)
  bank_id: {
    required: true,
    pattern: /^[0-9]{6}$/,
    message: 'Mã ngân hàng phải có đúng 6 số',
  },
  
  // Account No: 6-20 số
  account_no: {
    required: true,
    pattern: /^[0-9]{6,20}$/,
    message: 'Số tài khoản từ 6-20 số, chỉ chứa số',
  },
  
  // Account Name: CHỮ HOA và khoảng trắng
  account_name: {
    required: true,
    pattern: /^[A-Z\s]+$/,
    message: 'Tên phải viết HOA không dấu (VD: NGUYEN VAN A)',
  },
};

export interface BankInfoData {
  bank_id?: string;
  account_no?: string;
  account_name?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate bank info data
 */
export const validateBankInfo = (data: BankInfoData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(bankValidationRules).forEach((field) => {
    const rule = bankValidationRules[field as keyof BankValidationRules];
    const value = data[field as keyof BankInfoData];
    
    if (rule.required && !value) {
      errors[field] = `${getFieldLabel(field)} là bắt buộc`;
    } else if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message;
    }
  });
  
  return errors;
};

/**
 * Get friendly field label
 */
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    bank_id: 'Ngân hàng',
    account_no: 'Số tài khoản',
    account_name: 'Tên chủ tài khoản',
  };
  return labels[field] || field;
};

/**
 * Normalize account name to uppercase without diacritics
 */
export const normalizeAccountName = (input: string): string => {
  return input
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .replace(/[^A-Z\s]/g, ''); // Chỉ giữ chữ HOA và space
};

/**
 * Validate single field
 */
export const validateField = (field: keyof BankValidationRules, value: string): string | null => {
  const rule = bankValidationRules[field];
  
  if (rule.required && !value) {
    return `${getFieldLabel(field)} là bắt buộc`;
  }
  
  if (value && rule.pattern && !rule.pattern.test(value)) {
    return rule.message;
  }
  
  return null;
};

/**
 * Check if bank info is complete
 */
export const isBankInfoComplete = (data: BankInfoData): boolean => {
  return !!(
    data.bank_id &&
    data.account_no &&
    data.account_name &&
    Object.keys(validateBankInfo(data)).length === 0
  );
};
