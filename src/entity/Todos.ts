import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { Users } from "./Users";

/* eslint-disable no-unused-vars */
export enum TodoStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    IN_PROGRESS = "in-progress",
}

/* eslint-disable no-unused-vars */
export enum TodoPriority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
}

@Entity()
export class Todos {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "text" })
    content!: string;

    @Column({ type: "timestamp" })
    deadline!: Date;

    @ManyToOne(() => Users, (user) => user.id, { nullable: false })
    @JoinColumn({ name: "created_by" }) 
    created_by!: Users;

    @ManyToOne(() => Users, (user) => user.id, { nullable: false })
    @JoinColumn({ name: "assigned_to" }) 
    assigned_to!: Users;


    @Column({ type: "enum", enum: TodoStatus, default: TodoStatus.PENDING })
    status!: TodoStatus;

    @Column({ type: "enum", enum: TodoPriority, default: TodoPriority.MEDIUM })
    priority!: TodoPriority;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
