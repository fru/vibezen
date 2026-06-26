import { Routes } from '@angular/router';
import { MessagesComponent } from './messages/messages';
import { OtherComponent } from './other/other';

export const routes: Routes = [
  { 
    path: 'messages', 
    component: MessagesComponent, 
    title: 'Nachrichten'
  },
  {
    path: 'filter/rooms',
    component: OtherComponent,
    title: 'Zimmer'
  },
  {
    path: 'filter/workflow',
    component: OtherComponent,
    title: 'Arbeitsablauf'
  },
  { path: '**', redirectTo: 'messages' },
];
