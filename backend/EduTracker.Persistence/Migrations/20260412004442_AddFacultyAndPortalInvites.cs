using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduTracker.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFacultyAndPortalInvites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_departments_organization_id_name",
                table: "departments");

            migrationBuilder.AddColumn<Guid>(
                name: "department_id",
                table: "organization_members",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "faculty_id",
                table: "organization_members",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "faculty_id",
                table: "departments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "faculties",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_faculties", x => x.id);
                    table.ForeignKey(
                        name: "fk_faculties_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "portal_invites",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    email_hash = table.Column<byte[]>(type: "bytea", maxLength: 32, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    token_hash = table.Column<byte[]>(type: "bytea", maxLength: 32, nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    consumed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_portal_invites", x => x.id);
                    table.ForeignKey(
                        name: "fk_portal_invites_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_portal_invites_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_department_id",
                table: "organization_members",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_faculty_id",
                table: "organization_members",
                column: "faculty_id");

            migrationBuilder.CreateIndex(
                name: "ix_departments_faculty_id_name",
                table: "departments",
                columns: new[] { "faculty_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_departments_organization_id",
                table: "departments",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "ix_faculties_organization_id_name",
                table: "faculties",
                columns: new[] { "organization_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_portal_invites_email",
                table: "portal_invites",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "ix_portal_invites_invited_by_user_id",
                table: "portal_invites",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_portal_invites_organization_id_email_hash",
                table: "portal_invites",
                columns: new[] { "organization_id", "email_hash" },
                unique: true,
                filter: "consumed_at IS NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_departments_faculties_faculty_id",
                table: "departments",
                column: "faculty_id",
                principalTable: "faculties",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_organization_members_departments_department_id",
                table: "organization_members",
                column: "department_id",
                principalTable: "departments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_organization_members_faculties_faculty_id",
                table: "organization_members",
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

            migrationBuilder.DropForeignKey(
                name: "fk_organization_members_departments_department_id",
                table: "organization_members");

            migrationBuilder.DropForeignKey(
                name: "fk_organization_members_faculties_faculty_id",
                table: "organization_members");

            migrationBuilder.DropTable(
                name: "faculties");

            migrationBuilder.DropTable(
                name: "portal_invites");

            migrationBuilder.DropIndex(
                name: "ix_organization_members_department_id",
                table: "organization_members");

            migrationBuilder.DropIndex(
                name: "ix_organization_members_faculty_id",
                table: "organization_members");

            migrationBuilder.DropIndex(
                name: "ix_departments_faculty_id_name",
                table: "departments");

            migrationBuilder.DropIndex(
                name: "ix_departments_organization_id",
                table: "departments");

            migrationBuilder.DropColumn(
                name: "department_id",
                table: "organization_members");

            migrationBuilder.DropColumn(
                name: "faculty_id",
                table: "organization_members");

            migrationBuilder.DropColumn(
                name: "faculty_id",
                table: "departments");

            migrationBuilder.CreateIndex(
                name: "ix_departments_organization_id_name",
                table: "departments",
                columns: new[] { "organization_id", "name" },
                unique: true);
        }
    }
}
