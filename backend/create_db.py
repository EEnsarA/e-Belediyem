import asyncio
import asyncpg

async def create_db():
    # .env'deki şifren (URL-encoded olmayan hali)
    password = r']LcNaQ6zrl&Fx09[[RoU' 
    
    try:
        # Varsayılan 'postgres' veritabanına bağlan
        conn = await asyncpg.connect(
            user='postgres',
            password=password,
            host='localhost',
            database='postgres'
        )
        try:
            # Veritabanını oluştur
            await conn.execute('CREATE DATABASE akilli_belediye')
            print("\n✅ 'akilli_belediye' veritabanı başarıyla oluşturuldu!")
        except asyncpg.exceptions.DuplicateDatabaseError:
            print("\nℹ️ Veritabanı zaten mevcut.")
        finally:
            await conn.close()
    except Exception as e:
        print(f"\n❌ Hata oluştu: {e}")
        print("Lütfen PostgreSQL şifrenin doğruluğundan ve servisin çalıştığından emin ol.")

if __name__ == "__main__":
    asyncio.run(create_db())
