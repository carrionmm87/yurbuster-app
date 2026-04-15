

print("=" * 40)
print("       BIENVENIDOS AL CINE")
print("=" * 40)
print()
print("1. Entrada Normal : $3.000")
print("2. Entrada VIP    : $7.000")
print()
 
opcion = int(input("Seleccione una opción (1 o 2): "))
cantidad = int(input("¿Cuántas entradas desea comprar?: "))
 
if opcion == 1:
    tipo = "Normal"
    precio = 3000
elif opcion == 2:
    tipo = "VIP"
    precio = 7000
else:
    print("Opción no válida")
    exit()
 
total = precio * cantidad
 
print()
print("=" * 40)
print("           RESUMEN DE COMPRA")
print("=" * 40)
print(f"Tipo de entrada: {tipo}")
print(f"Precio unitario: ${precio:,}".replace(",", "."))
print(f"Cantidad       : {cantidad}")
print("-" * 40)
print(f"TOTAL A PAGAR  : ${total:,}".replace(",", "."))
print("=" * 40)
print()
print("¡Gracias por su compra! Disfrute la película.")