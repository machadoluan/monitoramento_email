// src/alert/alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('alerts')
export class AlertEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column() time: string;
    @Column() aviso: string;
    @Column({ nullable: true }) data: string;
    @Column({ nullable: true }) hora: string;
    @Column() ip: string;
    @Column() nomeSistema: string;
    @Column() contato: string;
    @Column() localidade: string;
    @Column() status: string;

    @CreateDateColumn() createdAt: Date;
    @Column('text', { nullable: true })
    mensagemOriginal?: string;

}
