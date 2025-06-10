// components/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformService } from '../../../services/platform.service';
import { EmailService } from '../../../services/email.service';
import { AuthService } from '../../../services/auth.service';
import { Platform } from '../../../models/platform.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  platforms: Platform[] = [];
  loading = true;
  error = '';

  // Variables pour l'envoi d'email
  selectedPlatformId: number | null = null;
  emailMessage = '';
  sendingEmail = false;

  displayedColumns: string[] = ['name', 'url', 'status', 'lastCheck', 'actions'];

  constructor(
    private platformService: PlatformService,
    private emailService: EmailService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier que l'utilisateur est admin
    // if (!this.authService.isAdmin()) {
    //   this.router.navigate(['/dashboard']);
    //   return;
    // }

    this.loadPlatforms();
  }

  loadPlatforms(): void {
    this.loading = true;
    this.error = '';

    this.platformService.getAllPlatforms().subscribe({
      next: (platforms) => {
        this.platforms = platforms;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des plateformes';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  checkPlatformStatus(platformId: string): void {
    const platform = this.platforms.find(p => p.platformId === platformId);
    if (!platform) return;

    platform.status = 'checking' as any; // Indicateur temporaire

    this.platformService.checkPlatformStatus(platformId).subscribe({
      next: (result) => {
        platform.status = result.status ;
        platform.lastCheck = new Date();
      },
      error: (error) => {
        console.error('Erreur lors de la vérification du statut:', error);
        platform.status = 'down';
        platform.lastCheck = new Date();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'UP': return 'success';
      case 'down': return 'danger';
      case 'checking': return 'warn';
      default: return 'default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'UP': return 'check_circle';
      case 'down': return 'error';
      case 'checking': return 'sync';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'UP': return 'En ligne';
      case 'down': return 'Hors ligne';
      case 'checking': return 'Vérification...';
      default: return 'Inconnu';
    }
  }

  openEmailDialog(platformId: number): void {
    this.selectedPlatformId = platformId;
    this.emailMessage = '';
  }

  closeEmailDialog(): void {
    this.selectedPlatformId = null;
    this.emailMessage = '';
    this.sendingEmail = false;
  }

  sendEmail(): void {
    if (!this.selectedPlatformId || !this.emailMessage.trim()) {
      return;
    }

    this.sendingEmail = true;

    this.emailService.sendPlatformAlert(this.selectedPlatformId, this.emailMessage).subscribe({
      next: (success) => {
        if (success) {
          console.log('Email envoyé avec succès');
        }
        this.closeEmailDialog();
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        this.sendingEmail = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  refreshAllStatuses(): void {
    this.platforms.forEach(platform => {
      this.checkPlatformStatus(platform.platformId);
    });
  }

  getPlatformsUp(): number {
    return this.platforms.filter(p => p.status === 'UP').length;
  }

  getPlatformsDown(): number {
    return this.platforms.filter(p => p.status === 'down').length;
  }
}
