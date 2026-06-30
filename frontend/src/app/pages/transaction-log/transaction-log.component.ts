import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionLogService, TransactionLog } from '../../services/transaction-log.service';

@Component({
  selector: 'app-transaction-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-log.component.html',
  styleUrls: ['./transaction-log.component.css']
})
export class TransactionLogComponent implements OnInit {
  logs: TransactionLog[] = [];
  loading = true;

  constructor(private logService: TransactionLogService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.logService.getLogs().subscribe({
      next: (res) => {
        this.logs = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatJson(data: any): string {
    if (!data) return '—';
    return JSON.stringify(data, null, 2);
  }
}
