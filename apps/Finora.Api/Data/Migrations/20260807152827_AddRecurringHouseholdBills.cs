using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringHouseholdBills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "HouseholdBills",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "HouseholdBills");
        }
    }
}
