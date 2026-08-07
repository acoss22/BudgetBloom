using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryColors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Categories\" SET \"Icon\" = 'category' WHERE \"Icon\" IS NULL OR btrim(\"Icon\") = '';");

            migrationBuilder.AlterColumn<string>(
                name: "Icon",
                table: "Categories",
                type: "text",
                nullable: false,
                defaultValue: "category",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Categories",
                type: "text",
                nullable: false,
                defaultValue: "#607D8B");

            migrationBuilder.Sql("""
                UPDATE "Categories" SET "Icon" = CASE "Name"
                    WHEN 'Housing' THEN 'home' WHEN 'Groceries' THEN 'shopping_cart'
                    WHEN 'Transport' THEN 'directions_car' WHEN 'Utilities' THEN 'bolt'
                    WHEN 'Health' THEN 'medical_services' WHEN 'Entertainment' THEN 'sports_esports'
                    WHEN 'Shopping' THEN 'shopping_bag' WHEN 'Subscriptions' THEN 'subscriptions'
                    WHEN 'Salary' THEN 'payments' WHEN 'Freelance' THEN 'work'
                    WHEN 'Investments' THEN 'monitoring' WHEN 'Gifts' THEN 'redeem'
                    ELSE "Icon" END,
                "Color" = CASE "Name"
                    WHEN 'Housing' THEN '#5B7DB1' WHEN 'Groceries' THEN '#4F8A5B'
                    WHEN 'Transport' THEN '#607D8B' WHEN 'Utilities' THEN '#D29B35'
                    WHEN 'Health' THEN '#C45B6A' WHEN 'Entertainment' THEN '#8A65B5'
                    WHEN 'Shopping' THEN '#C06C9B' WHEN 'Subscriptions' THEN '#4B8F9C'
                    WHEN 'Salary' THEN '#397454' WHEN 'Freelance' THEN '#3E7C8F'
                    WHEN 'Investments' THEN '#6A7F3F' WHEN 'Gifts' THEN '#A66A8B'
                    ELSE '#607D8B' END
                WHERE "IsDefault" = TRUE;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Categories");

            migrationBuilder.AlterColumn<string>(
                name: "Icon",
                table: "Categories",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
