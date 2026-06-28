import {
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewChat } from './view-chat';
import { ViewChatBubble } from './view-chat-bubble';
import { ViewChatInput } from './view-chat-input';
import {
  ChatService,
  type ChatMessageDto,
} from '../services/chat';
import { UserService } from '../services/user';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  outgoing: boolean;
  pending: boolean;
}

/**
 * Smart component that owns the message list for a single chat room.
 *
 * Responsibilities:
 *  - Load messages for the current room/user.
 *  - Send messages with optimistic updates.
 *  - Mark the room as read once messages are loaded.
 *  - Re-fetch whenever the room or user changes.
 *
 * It renders the presentational `view-chat*` components and exposes a
 * `messages` signal so parents can react to data changes (e.g. unread
 * count updates triggering a reload).
 */
@Component({
  selector: 'data-chat',
  imports: [ViewChat, ViewChatBubble, ViewChatInput],
  template: `
    <view-chat [chatName]="room()" #chat>
      @for (message of messages(); track message.id) {
        <view-chat-bubble
          [content]="message.content"
          [time]="formatTime(message.timestamp)"
          [outgoing]="message.outgoing"
        />
      }
      <view-chat-input
        view-chat-input
        [(draft)]="draft"
        (send)="send()"
      />
    </view-chat>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
      }
    `,
  ],
})
export class DataChat implements OnDestroy {
  private readonly api = inject(ChatService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly userService = inject(UserService);

  private readonly chat = viewChild(ViewChat);

  /** Room name to load messages for. */
  readonly room = input<string>('common');

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');

  /**
   * Whether the window is currently "active" — visible and focused.
   * `markAsRead` is only fired while this is true so background tabs
   * don't clear unread counts the user hasn't actually seen.
   */
  private readonly windowActive = signal(this.isWindowActive());

  private readonly visibilityHandler = (): void => {
    const active = this.isWindowActive();
    if (active && !this.windowActive()) {
      // User just returned to the window — mark the current room as read
      // if messages are already loaded.
      this.windowActive.set(true);
      this.markCurrentRoomRead();
    } else {
      this.windowActive.set(active);
    }
  };

  constructor() {
    // Reload messages whenever the room or current user changes.
    effect(() => {
      this.room();
      this.userService.user();
      this.loadMessages();
    });

    // Auto-scroll to the latest message whenever the list changes.
    effect(() => {
      this.messages();
      queueMicrotask(() => this.chat()?.scrollToBottom());
    });

    // Re-subscribe to unread-count updates whenever the room changes,
    // and re-fetch messages when the count for the current room changes.
    effect((onCleanup) => {
      const room = this.room();
      let lastCount = -1;
      const unsubscribe = this.api.onCounts(room, (next) => {
        if (next !== lastCount) {
          lastCount = next;
          this.loadMessages();
        }
      });
      onCleanup(() => unsubscribe());
    });

    // Track window visibility/focus so we only mark as read when active.
    window.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.visibilityHandler);
    window.addEventListener('blur', this.visibilityHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('focus', this.visibilityHandler);
    window.removeEventListener('blur', this.visibilityHandler);
  }

  private isWindowActive(): boolean {
    return !document.hidden && document.hasFocus();
  }

  /** Marks the current room as read, but only if the window is active. */
  private markCurrentRoomRead(): void {
    if (!this.windowActive() || this.messages().length === 0) {
      return;
    }
    const room = this.room();
    const currentUser = this.userService.user();
    this.api.markAsRead(room, currentUser).subscribe();
  }

  private loadMessages(): void {
    const room = this.room();
    const currentUser = this.userService.user();
    this.api.getMessages(room).subscribe({
      next: (dtos) => {
        this.messages.set(
          dtos.map((dto) => this.toChatMessage(dto, currentUser)),
        );
        // Mark the room as read now that the user has the latest messages,
        // but only if they're actually looking at the window.
        this.markCurrentRoomRead();
      },
      error: () => {
        this.snackBar.open('Failed to load messages', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text) {
      return;
    }

    const id = crypto.randomUUID();
    const optimisticMessage: ChatMessage = {
      id,
      content: text,
      timestamp: new Date(),
      outgoing: true,
      pending: true,
    };

    this.messages.update((list) => [...list, optimisticMessage]);
    this.draft.set('');

    const room = this.room();
    const user = this.userService.user();

    this.api.sendMessage(room, { id, username: user, content: text }).subscribe({
      next: (dto) => {
        this.messages.update((list) =>
          list.map((m) =>
            m.id === id ? this.toChatMessage(dto, user) : m,
          ),
        );
      },
      error: () => {
        // Remove the optimistic message and restore the content to the input.
        this.messages.update((list) => list.filter((m) => m.id !== id));
        this.draft.set(text);
        this.snackBar.open('Message failed to send', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  private toChatMessage(dto: ChatMessageDto, currentUser: string): ChatMessage {
    return {
      id: dto.id,
      content: dto.content,
      timestamp: new Date(dto.timestamp),
      outgoing: dto.username === currentUser,
      pending: false,
    };
  }

  protected formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
