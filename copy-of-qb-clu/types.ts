
export interface BalanceResult {
  unbalancedEquation: string;
  balancedEquation: string;
  synthesis: string;
  explanation: string;
  steps: string[];
  isSolvable: boolean;
  neutralizationType: 'NONE' | 'COLD' | 'HEAT' | 'IMPOSSIBLE';
  warningMessage?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
