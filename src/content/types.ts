export interface StepMeta {
  id: number;
  slug: string;
  title: string;
  goal: string;
}

export interface ContentBlockData {
  id: string;
  title: string;
  type: 'text' | 'table' | 'diagram' | 'code' | 'callout' | 'state-chain' | 'list';
  content?: string;
  listItems?: string[];
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  diagramCode?: string;
  codeSnippet?: {
    language: string;
    code: string;
    explanation?: string;
  };
  calloutType?: 'info' | 'warning' | 'danger' | 'success';
  stateChainData?: {
    states: { label: string; status?: 'active' | 'success' | 'failed' | 'neutral' | 'pending' }[];
  };
}

export interface JuryQuestionData {
  question: string;
  answer: string;
  keyPoints: string[];
}

export interface StepData extends StepMeta {
  blocks: ContentBlockData[];
  juryQuestion: JuryQuestionData;
}
