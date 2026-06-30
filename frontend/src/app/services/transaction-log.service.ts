import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface TransactionLog {
  id: number;
  tx_id: string;
  operation_type: string;
  table_name: string;
  record_id: number;
  old_data: any;
  new_data: any;
  performed_by: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionLogService {
  constructor(private api: ApiService) {}

  getLogs(): Observable<TransactionLog[]> {
    return this.api.get<TransactionLog[]>('/analytics/transaction-log');
  }
}
