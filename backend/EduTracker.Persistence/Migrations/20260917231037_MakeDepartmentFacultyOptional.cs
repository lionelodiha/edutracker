using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduTracker.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeDepartmentFacultyOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_departments_faculties_faculty_id",
                table: "departments");

            migrationBuilder.DropIndex(
                name: "ix_departments_faculty_id_name",
                table: "departments");

            migrationBuilder.DropIndex(
                name: "ix_departments_organization_id",
                table: "departments");

            migrationBuilder.AlterColumn<Guid>(
                name: "faculty_id",
                table: "departments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "ix_departments_faculty_id",
                table: "departments",
                column: "faculty_id");

            migrationBuilder.CreateIndex(
                name: "ix_departments_organization_id_name",
                table: "departments",
                columns: new[] { "organization_id", "name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_departments_faculties_faculty_id",
                table: "departments",
                column: "faculty_id",
                principalTable: "faculties",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_departments_faculties_faculty_id",
                table: "departments");

            migrationBuilder.DropIndex(
                name: "ix_departments_faculty_id",
                table: "departments");

            migrationBuilder.DropIndex(
                name: "ix_departments_organization_id_name",
                table: "departments");

            migrationBuilder.AlterColumn<Guid>(
                name: "faculty_id",
                table: "departments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_departments_faculty_id_name",
                table: "departments",
                columns: new[] { "faculty_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_departments_organization_id",
                table: "departments",
                column: "organization_id");

            migrationBuilder.AddForeignKey(
                name: "fk_departments_faculties_faculty_id",
                table: "departments",
                column: "faculty_id",
                principalTable: "faculties",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
