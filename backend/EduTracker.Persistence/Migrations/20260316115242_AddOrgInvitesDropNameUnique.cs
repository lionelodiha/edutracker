using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduTracker.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgInvitesDropNameUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_organizations_name",
                table: "organizations");

            migrationBuilder.CreateTable(
                name: "organization_invites",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invited_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_invites", x => x.id);
                    table.ForeignKey(
                        name: "fk_organization_invites_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_organization_invites_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_organization_invites_users_invited_user_id",
                        column: x => x.invited_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_organizations_name",
                table: "organizations",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_organization_invites_invited_by_user_id",
                table: "organization_invites",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_organization_invites_invited_user_id_status",
                table: "organization_invites",
                columns: new[] { "invited_user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_organization_invites_organization_id_invited_user_id",
                table: "organization_invites",
                columns: new[] { "organization_id", "invited_user_id" },
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "ix_organization_invites_organization_id_status",
                table: "organization_invites",
                columns: new[] { "organization_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_invites");

            migrationBuilder.DropIndex(
                name: "ix_organizations_name",
                table: "organizations");

            migrationBuilder.CreateIndex(
                name: "ix_organizations_name",
                table: "organizations",
                column: "name",
                unique: true);
        }
    }
}
