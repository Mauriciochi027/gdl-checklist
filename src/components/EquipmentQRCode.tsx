import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { Equipment } from "@/types/equipment";
interface EquipmentQRCodeProps {
  equipment: Equipment;
}
const EquipmentQRCode = ({
  equipment
}: EquipmentQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  useEffect(() => {
    generateQRCode();
  }, [equipment]);
  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    // Dados do equipamento para o QR Code baseados na imagem fornecida
    const equipmentData = {
      nomeOperador: equipment.operatorName || "Carlos Oliveira",
      matriculaId: equipment.operatorId || "MEC001",
      equipamento: `${equipment.brand} ${equipment.model}`,
      modelo: equipment.model,
      anoFabricacao: equipment.year,
      serial: equipment.equipmentSeries || equipment.code,
      centroCusto: equipment.costCenter || "Não informado",
      unidadeNegociosGDL: equipment.businessUnit || "GDL Principal",
      modeloEquipamento: equipment.model,
      local: equipment.location || equipment.sector || "Não informado",
      unidade: equipment.unit || "Principal",
      serieEquipamento: equipment.equipmentSeries || equipment.code,
      numeroEquipamento: equipment.equipmentNumber || equipment.code,
      horimetro: equipment.hourMeter || "0",
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
  return <Card className="w-fit">
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

        <div className="text-sm text-gray-600 space-y-1">
          
          
          <p><strong>Equipamento:</strong> {equipment.brand} {equipment.model}</p>
          <p><strong>Modelo:</strong> {equipment.model}</p>
          <p><strong>Ano de Fabricação:</strong> {equipment.year}</p>
          <p><strong>Serial:</strong> {equipment.equipmentSeries || equipment.code}</p>
          <p><strong>Centro de Custo:</strong> {equipment.costCenter || "Não informado"}</p>
          <p><strong>Unidade de Negócios GDL:</strong> {equipment.businessUnit || "GDL Principal"}</p>
          <p><strong>Local:</strong> {equipment.location || equipment.sector}</p>
          <p><strong>Série:</strong> {equipment.equipmentSeries || equipment.code}</p>
          <p><strong>Número:</strong> {equipment.equipmentNumber || equipment.code}</p>
          <p><strong>Horímetro:</strong> {equipment.hourMeter || "0"}</p>
        </div>

        <Button onClick={downloadQRCode} className="w-full" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Baixar QR Code
        </Button>
      </CardContent>
    </Card>;
};
export default EquipmentQRCode;