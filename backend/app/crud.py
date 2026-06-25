from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(func.lower(models.Product.sku) == sku.lower().strip()).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name.strip(),
        sku=product.sku.strip(),
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product


# --- Customer CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(func.lower(models.Customer.email) == email.lower().strip()).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(
        name=customer.name.strip(),
        email=customer.email.strip().lower(),
        phone=customer.phone.strip()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- Order CRUD ---
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    # 1. Check if customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_in.customer_id).first()
    if not customer:
        raise ValueError(f"Customer with ID {order_in.customer_id} does not exist")

    # 2. Process items, validate stock, and calculate total
    order_items_to_create = []
    total_amount = 0.0

    for item in order_in.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise ValueError(f"Product with ID {item.product_id} does not exist")
        
        if product.quantity < item.quantity:
            raise ValueError(
                f"Insufficient stock for product '{product.name}'. "
                f"Requested: {item.quantity}, Available: {product.quantity}"
            )
        
        # Calculate item cost
        item_price = product.price
        total_amount += item_price * item.quantity

        order_items_to_create.append((product, item.quantity, item_price))

    # 3. Create the Order
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush()  # Generates the db_order.id

    # 4. Create OrderItems and reduce stock
    for product, qty, price in order_items_to_create:
        # Reduce stock
        product.quantity -= qty
        
        # Create item record
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=qty,
            price=price
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None
    
    # Restore stock of products
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order
