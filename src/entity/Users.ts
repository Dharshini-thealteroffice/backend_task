import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity()
export class Users {
    @PrimaryGeneratedColumn()
    id?: number;
  
    @Column({ type: "varchar", length: 255 })
    name!: string; 
}
