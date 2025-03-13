import "dotenv/config";
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

const main = async () => {
    try {
        console.log("Running manual migration to add role column...");
        
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'db', 'migrations', 'add_role_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Run the SQL
        await client.unsafe(sql);
        
        console.log("Migration completed successfully!");
        console.log("Role column has been added to the users table.");
        
    } catch (error) {
        console.error("Error running migration:", error);
        throw new Error("Migration failed");
    } finally {
        // Close the database connection
        await client.end();
    }
};

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
}); 