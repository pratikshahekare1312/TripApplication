import mysql.connector
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)
cursor = conn.cursor()

# Pehle confirm karo ki hum sahi database aur server se connected hain
cursor.execute("SELECT DATABASE(), @@hostname, @@port")
db_name, hostname, port = cursor.fetchone()
print(f"Connected to database: {db_name} | host: {hostname} | port: {port}")

cursor.execute("SELECT COUNT(*) FROM places")
before = cursor.fetchone()[0]
print(f"Places before truncate: {before}")

print("\nTruncating tables...")
cursor.execute("SET FOREIGN_KEY_CHECKS=0")
for table in ["place_best_for", "place_age_group", "place_activities",
              "place_trip_purpose", "place_transport_modes", "places"]:
    cursor.execute(f"TRUNCATE TABLE {table}")
    print(f"  ✓ {table} truncated")
cursor.execute("SET FOREIGN_KEY_CHECKS=1")

conn.commit()

cursor.execute("SELECT COUNT(*) FROM places")
after = cursor.fetchone()[0]
print(f"\nPlaces after truncate: {after}")

cursor.close()
conn.close()