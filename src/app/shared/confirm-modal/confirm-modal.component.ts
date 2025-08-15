import { Component, EventEmitter, Input, Output } from '@angular/core';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [
    NgClass,
    NgIf
  ],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  @Input() show = false;
  @Input() message = 'Bạn có chắc chắn muốn xoá?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
