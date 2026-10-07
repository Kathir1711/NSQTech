import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';

@NgModule({ declarations: [AdminComponent], imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild([{ path: '', component: AdminComponent }])] })
export class AdminModule {}
