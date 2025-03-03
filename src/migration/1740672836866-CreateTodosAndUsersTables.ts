import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTodosAndUsersTables1740672836866 implements MigrationInterface {
    name = 'CreateTodosAndUsersTables1740672836866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`todos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, \`deadline\` timestamp NOT NULL, \`status\` enum ('pending', 'completed', 'in-progress') NOT NULL DEFAULT 'pending', \`priority\` enum ('high', 'medium', 'low') NOT NULL DEFAULT 'medium', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` int NOT NULL, \`assigned_to\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`todos\` ADD CONSTRAINT \`FK_8ba0d6c1b7454fd07c2f4171076\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`todos\` ADD CONSTRAINT \`FK_dca43172d9b4b43e2cc86643b49\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`todos\` DROP FOREIGN KEY \`FK_dca43172d9b4b43e2cc86643b49\``);
        await queryRunner.query(`ALTER TABLE \`todos\` DROP FOREIGN KEY \`FK_8ba0d6c1b7454fd07c2f4171076\``);
        await queryRunner.query(`DROP TABLE \`todos\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
