import cv2
from pyzbar import pyzbar

cap = cv2.VideoCapure(0)
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    barcodes = pyzbar.decode(frame)
    
    for arcode in barcodes:
        (x,yxw,h) = barcode.rect
        cv2.rectagle(frame, (x,y), (x+w, y+h), (0,255,0), 2)
        barcode_value = barcode.data.decode("utf-8")
        cv2.putText(frame, barccode_value, (x,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0),2)

    cv2.imshow("Barcode Scanner", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
# Liberar los recursos
cap.release()
cv2.destroyAllWindows()

