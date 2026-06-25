from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from . import models, crud, schemas
from .routers import products, customers, orders
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Production-Ready Full-Stack Technical Assessment API",
    version="1.0.0"
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

# Automatic Database Seeding
def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(models.Product).count() > 0:
        return

    print("Seeding database with initial mock data...")
    
    # 1. Create Mock Products
    products = [
        models.Product(name="Ergonomic Mechanical Keyboard", sku="PROD-KYBD-01", price=129.99, quantity=25),
        models.Product(name="Precision Wireless Mouse", sku="PROD-MOUS-02", price=79.50, quantity=40),
        models.Product(name="UltraWide 34\" 4K Monitor", sku="PROD-MONI-03", price=499.99, quantity=10),
        models.Product(name="Noise-Cancelling Headphones", sku="PROD-HDPH-04", price=199.99, quantity=15),
        models.Product(name="Smart Adjustable Standing Desk", sku="PROD-DESK-05", price=599.00, quantity=5),
        models.Product(name="Ergonomic Mesh Office Chair", sku="PROD-CHAIR-06", price=299.95, quantity=0), # Out of stock product
    ]
    db.add_all(products)
    db.commit()

    # 2. Create Mock Customers
    customers = [
        models.Customer(name="John Doe", email="john.doe@example.com", phone="+1-555-0199"),
        models.Customer(name="Jane Smith", email="jane.smith@example.com", phone="+1-555-0182"),
        models.Customer(name="Robert Johnson", email="robert.j@example.com", phone="+1-555-0143"),
    ]
    db.add_all(customers)
    db.commit()

    # Refresh to get IDs
    for p in products:
        db.refresh(p)
    for c in customers:
        db.refresh(c)

    # 3. Create Mock Orders (which will also automatically reduce stock)
    # Order 1: John Doe buys a Keyboard and a Mouse
    order1_in = schemas.OrderCreate(
        customer_id=customers[0].id,
        items=[
            schemas.OrderItemCreate(product_id=products[0].id, quantity=1),  # Keyboard
            schemas.OrderItemCreate(product_id=products[1].id, quantity=2)   # Mouse x2
        ]
    )
    crud.create_order(db=db, order_in=order1_in)

    # Order 2: Jane Smith buys a Monitor
    order2_in = schemas.OrderCreate(
        customer_id=customers[1].id,
        items=[
            schemas.OrderItemCreate(product_id=products[2].id, quantity=1)   # Monitor
        ]
    )
    crud.create_order(db=db, order_in=order2_in)

    print("Database seeding completed successfully.")

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
    except Exception as e:
        print(f"Error during database seeding: {e}")
    finally:
        db.close()

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management System API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
