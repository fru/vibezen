import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViewMainMenuItem } from './view-main-menu/view-main-menu-item';
import { ViewMainMenuGroup } from './view-main-menu/view-main-menu-group';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    ViewMainMenuItem,
    ViewMainMenuGroup,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly openMessageCount = 3;
  protected readonly title = toSignal(
    this.router.events.pipe(
      map(() => this.router.routerState.snapshot.root.firstChild?.title ?? ''),
    )
  );

  goBack(): void {
    this.location.back();
  }
}
