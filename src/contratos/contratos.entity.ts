import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Contratos {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column()
    telefone: string;

    @Column()
    endereco: string;

    @Column({ type: 'text', nullable: true })
    tags: string;

    @Column({ nullable: true, default: false })
    sinal: boolean;
    

    @CreateDateColumn() createdAt: Date;
}