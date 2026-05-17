import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  time: string;
  loading?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent {
  isOpen = false;
  question = '';
  messages: ChatMessage[] = [];
  loading = false;

  readonly suggestions = [
    'Which dealer has the most pending payments?',
    'How much did we earn this month?',
    'Which driver completed the most trips?',
    'Show overdue payments',
    'Total salary pending for drivers?',
    'How many trucks are available?'
  ];

  constructor(private http: HttpClient) {
    // Welcome message
    this.messages.push({
      role: 'ai',
      text: '👋 Hi! I\'m your LoadTrack AI assistant. Ask me anything about your trucks, drivers, dealers, trips, or payments!',
      time: this.getTime()
    });
  }

  toggle() { this.isOpen = !this.isOpen; }

  useSuggestion(s: string) {
    this.question = s;
    this.send();
  }

  send() {
    if (!this.question.trim() || this.loading) return;

    const userMsg = this.question.trim();
    this.question = '';

    // Add user message
    this.messages.push({ role: 'user', text: userMsg, time: this.getTime() });

    // Add loading placeholder
    const loadingMsg: ChatMessage = { role: 'ai', text: '', time: this.getTime(), loading: true };
    this.messages.push(loadingMsg);
    this.loading = true;

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 50);

    this.http.post<ApiResponse<string>>(`${environment.apiUrl}/ai/chat`, { question: userMsg }).subscribe({
      next: (res) => {
        loadingMsg.text = res.data;
        loadingMsg.loading = false;
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        loadingMsg.text = '⚠️ Request failed. Please wait a moment and try again.';
        loadingMsg.loading = false;
        this.loading = false;
      }
    });
  }

  clearChat() {
    this.messages = [{
      role: 'ai',
      text: '👋 Chat cleared! Ask me anything about LoadTrack.',
      time: this.getTime()
    }];
  }

  private getTime(): string {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom() {
    const el = document.querySelector('.chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }
}
