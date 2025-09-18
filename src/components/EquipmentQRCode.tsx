import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface Equipment {
  id: string;
  code: string;
  model: string;
  brand: string;
  year: number;
  sector: string;
  operatorName?: string;
  operatorId?: string;
  location?: string;
  unit?: string;
  equipmentSeries?: string;
  equipmentNumber?: string;
  hourMeter?: string;
}

interface EquipmentQRCodeProps {
  equipment: Equipment;
  operatorName?: string;
  operatorId?: string;
}

const EquipmentQRCode = ({ equipment, operatorName = "Carlos Oliveira", operatorId = "MEC001" }: EquipmentQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  useEffect(() => {
    generateQRCode();
  }, [equipment, operatorName, operatorId]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    // Dados do equipamento para o QR Code (conforme imagem fornecida)
    const equipmentData = {
      nomeOperador: operatorName,
      matriculaId: operatorId,
      equipamento: `${equipment.brand} ${equipment.model}`,
      modeloEquipamento: equipment.model,
      local: equipment.sector || "Não informado",
      unidade: "Principal",
      serieEquipamento: equipment.code,
      numeroEquipamento: equipment.code,
      horimetro: "0",
      equipmentId: equipment.id,
      timestamp: new Date().toISOString()
    };

    try {
      // Gerar QR code no canvas
      await QRCode.toCanvas(canvasRef.current, JSON.stringify(equipmentData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Gerar data URL para download
      const dataURL = await QRCode.toDataURL(JSON.stringify(equipmentData), {
        width: 400,
        margin: 2
      });
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = `qrcode-${equipment.code}.png`;
    link.href = qrCodeDataURL;
    link.click();
  };

  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code - {equipment.code}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="border rounded-lg" />
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Equipamento:</strong> {equipment.brand} {equipment.model}</p>
          <p><strong>Código:</strong> {equipment.code}</p>
          <p><strong>Setor:</strong> {equipment.sector || "Não informado"}</p>
        </div>

        <Button 
          onClick={downloadQRCode}
          className="w-full"
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar QR Code
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipmentQRCode;