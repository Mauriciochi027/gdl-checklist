import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PhotoGrid } from "@/components/ui/photo-viewer";
import { User, Truck, FileText, PenTool, Camera, QrCode, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import forkliftWorkingImage from "@/assets/forklift-working.png";
import mechanicIcon from "@/assets/mechanic-icon.jpg";
import { BrowserQRCodeReader } from '@zxing/library';
import { checklistItems, type ChecklistItem } from '@/lib/checklistItems';
import { ChecklistType, getChecklistItems, checklistTypeLabels, LiftingChecklistItem } from '@/lib/liftingAccessoryChecklists';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { Equipment, ChecklistAnswer } from '@/types/equipment';
interface ChecklistFormProps {
  equipments: Equipment[];
  onSubmitChecklist: (data: any) => void;
  checklistType: ChecklistType;
  onBack?: () => void;
}
const ChecklistForm = ({
  equipments,
  onSubmitChecklist,
  checklistType,
  onBack
}: ChecklistFormProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("");
  const [operatorId, setOperatorId] = useState<string>("");
  const [equipmentModel, setEquipmentModel] = useState<"eletrica" | "combustao" | "">("");
  const [location, setLocation] = useState<string>("");
  const [unit, setUnit] = useState<"01" | "02" | "03" | "">("");
  const [equipmentSeries, setEquipmentSeries] = useState<string>("");
  const [equipmentNumber, setEquipmentNumber] = useState<string>("");
  const [hourMeter, setHourMeter] = useState<string>("");
  const [operationDescription, setOperationDescription] = useState<string>("");
  const [loadDescription, setLoadDescription] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [signature, setSignature] = useState<string>("");
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [qrScanned, setQrScanned] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showCriticalDialog, setShowCriticalDialog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    user
  } = useAuth();

  // IDs dos itens críticos que podem paralisar o equipamento
  const criticalItems = ['4', '5', '7', '11']; // Vazamento hidráulico, Buzina, Freio, Sinal de ré

  useEffect(() => {
    if (user) {
      setOperatorName(user.name);
      setOperatorId(user.matricula || "");
    }
  }, [user]);

  // Get the appropriate checklist items based on type
  const currentChecklistItems = checklistType === 'empilhadeira' ? checklistItems : getChecklistItems(checklistType);
  const groupedItems = currentChecklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, (ChecklistItem | LiftingChecklistItem)[]>);
  const handleAnswerChange = (itemId: string, value: 'sim' | 'nao' | 'nao_aplica') => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        value,
        observation: prev[itemId]?.observation || ""
      }
    }));
  };
  const handleObservationChange = (itemId: string, observation: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        value: prev[itemId]?.value || 'nao',
        observation
      }
    }));
  };
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();

    // Handle both mouse and touch events
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';

    // Handle both mouse and touch events
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL());
  };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };
  const validateForm = (): boolean => {
    // Para acessórios de içamento, alguns campos não são obrigatórios
    const isLiftingAccessory = checklistType !== 'empilhadeira';
    if (!operatorName || !operatorId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e matrícula do operador.",
        variant: "destructive"
      });
      return false;
    }
    if (isLiftingAccessory) {
      // Para acessórios de içamento, validar descrição da operação e carga
      if (!operationDescription || !loadDescription) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha a descrição da operação e a carga a ser içada.",
          variant: "destructive"
        });
        return false;
      }
    } else {
      // Para empilhadeira, validar campos de equipamento
      if (!selectedEquipment || !equipmentModel || !location || !unit || !equipmentSeries || !equipmentNumber || !hourMeter) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios do equipamento.",
          variant: "destructive"
        });
        return false;
      }
    }
    const requiredItems = currentChecklistItems.filter(item => item.required);
    const missingAnswers = requiredItems.filter(item => !answers[item.id]);
    if (missingAnswers.length > 0) {
      toast({
        title: "Checklist incompleto",
        description: "Responda todos os itens obrigatórios do checklist.",
        variant: "destructive"
      });
      return false;
    }
    if (!signature) {
      toast({
        title: "Assinatura obrigatória",
        description: "A assinatura digital é obrigatória.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  const handleSubmit = () => {
    if (!validateForm()) return;

    // Verificar se há itens marcados como "não" (NOK)
    const hasNonConformItems = Object.values(answers).some(answer => answer.value === 'nao');

    // Para acessórios de içamento, qualquer item NOK bloqueia a operação
    const isLiftingAccessory = checklistType !== 'empilhadeira';

    // Para empilhadeiras, apenas itens críticos bloqueiam
    const hasCriticalIssues = isLiftingAccessory ? hasNonConformItems : criticalItems.some(itemId => {
      const answer = answers[itemId];
      return answer && answer.value === 'nao';
    });
    const checklistData = {
      equipmentId: selectedEquipment || null,
      operatorName,
      operatorId,
      equipmentModel: equipmentModel || checklistType,
      location: location || null,
      unit: unit || null,
      equipmentSeries: equipmentSeries || checklistType,
      equipmentNumber: equipmentNumber || null,
      hourMeter: hourMeter ? parseInt(hourMeter) : null,
      timestamp: new Date().toISOString(),
      answers: Object.values(answers),
      signature,
      photos,
      checklistType,
      operationDescription: isLiftingAccessory ? operationDescription : undefined,
      loadDescription: isLiftingAccessory ? loadDescription : undefined
    };
    onSubmitChecklist(checklistData);
    if (hasCriticalIssues) {
      setShowCriticalDialog(true);
    } else {
      setShowSuccessDialog(true);
    }
  };
  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    setShowCriticalDialog(false);

    // Reset form (keep operator data filled)
    setSelectedEquipment("");
    // Don't reset operator data - keep it from authenticated user
    if (user) {
      setOperatorName(user.name);
      setOperatorId(user.matricula || "");
    }
    setEquipmentModel("");
    setLocation("");
    setUnit("");
    setEquipmentSeries("");
    setEquipmentNumber("");
    setHourMeter("");
    setOperationDescription("");
    setLoadDescription("");
    setAnswers({});
    setSignature("");
    setPhotos({});
    setQrScanned(false);
    clearSignature();
  };
  const getAnswerBadge = (value: 'sim' | 'nao' | 'nao_aplica') => {
    switch (value) {
      case 'sim':
        return <Badge className="bg-safety-green text-white">OK</Badge>;
      case 'nao':
        return <Badge className="bg-safety-red text-white">NOK</Badge>;
      case 'nao_aplica':
        return <Badge className="bg-gray-500 text-white">N/A</Badge>;
      default:
        return null;
    }
  };
  const getProgressStats = () => {
    const totalItems = currentChecklistItems.length;
    const answeredItems = Object.keys(answers).length;
    const conformeItems = Object.values(answers).filter(a => a.value === 'sim').length;
    const naoConformeItems = Object.values(answers).filter(a => a.value === 'nao').length;
    return {
      total: totalItems,
      answered: answeredItems,
      conforme: conformeItems,
      naoConforme: naoConformeItems,
      progress: Math.round(answeredItems / totalItems * 100)
    };
  };
  const startQRScanning = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Câmera não suportada",
        description: "Seu dispositivo não suporta acesso à câmera.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsScanning(true);

      // First, try to get devices to find the best rear camera
      let devices = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (e) {
        console.warn('Could not enumerate devices:', e);
      }

      // Find rear camera
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const rearCamera = videoDevices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear') || device.label.toLowerCase().includes('environment'));

      // Setup video constraints with better mobile support
      const constraints = {
        video: {
          facingMode: {
            ideal: 'environment'
          },
          width: {
            ideal: 1280,
            max: 1920
          },
          height: {
            ideal: 720,
            max: 1080
          },
          ...(rearCamera && {
            deviceId: {
              exact: rearCamera.deviceId
            }
          })
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = () => resolve(undefined);
        });
        await videoRef.current.play();
        const codeReader = new BrowserQRCodeReader();

        // Setup scanning with retry logic
        let scanAttempts = 0;
        const maxAttempts = 10;
        const attemptScan = async (): Promise<void> => {
          try {
            scanAttempts++;
            const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current!);

            // Parse QR code result to extract equipment info
            const qrData = result.getText();
            console.log('QR Code scanned:', qrData);
            try {
              // Try to parse as JSON first (structured QR code)
              const parsedData = JSON.parse(qrData);
              if (parsedData.equipmentId) {
                const equipment = equipments.find(eq => eq.id === parsedData.equipmentId);
                if (equipment) {
                  setSelectedEquipment(equipment.id);
                  setOperatorName(parsedData.nomeOperador || operatorName);
                  setOperatorId(parsedData.matriculaId || operatorId);
                  setEquipmentModel(equipment.model.toLowerCase().includes('eletrica') ? 'eletrica' : 'combustao');
                  setLocation(parsedData.local || equipment.sector);
                  setUnit(parsedData.unidade === 'Principal' ? '01' : parsedData.unidade === 'Secundaria' ? '02' : '03');
                  setEquipmentSeries(parsedData.serieEquipamento || equipment.code);
                  setEquipmentNumber(parsedData.numeroEquipamento || equipment.code);
                  setHourMeter(parsedData.horimetro || '0');
                  setQrScanned(true);
                  toast({
                    title: "QR Code escaneado",
                    description: `Equipamento ${equipment.code} identificado automaticamente.`
                  });
                } else {
                  throw new Error('Equipment not found');
                }
              } else {
                throw new Error('Invalid QR structure');
              }
            } catch (error) {
              // Fallback: try to find equipment by code in raw QR data
              const equipment = equipments.find(eq => qrData.includes(eq.code) || qrData.includes(eq.id));
              if (equipment) {
                setSelectedEquipment(equipment.id);
                setEquipmentNumber(equipment.code);
                setEquipmentSeries(`${equipment.brand}-${equipment.model}`);
                setQrScanned(true);
                toast({
                  title: "QR Code escaneado",
                  description: `Equipamento ${equipment.code} identificado automaticamente.`
                });
              } else {
                toast({
                  title: "Equipamento não encontrado",
                  description: "QR Code lido, mas equipamento não está na lista.",
                  variant: "destructive"
                });
              }
            }

            // Stop camera on success
            stream.getTracks().forEach(track => track.stop());
            setIsScanning(false);
          } catch (err) {
            console.log(`Scan attempt ${scanAttempts} failed:`, err);
            if (scanAttempts < maxAttempts && isScanning) {
              // Retry after a short delay
              setTimeout(attemptScan, 1000);
            } else {
              throw err;
            }
          }
        };

        // Start scanning
        await attemptScan();
      }
    } catch (err) {
      console.error('Error in QR scanning:', err);

      // Stop any running streams
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsScanning(false);
      toast({
        title: "Erro no escaneamento",
        description: "Não foi possível escanear o QR Code. Verifique se a câmera está funcionando e tente novamente.",
        variant: "destructive"
      });
    }
  };
  const stopQRScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };
  const handlePhotoUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const photoData = e.target?.result as string;
        setPhotos(prev => ({
          ...prev,
          [itemId]: [...(prev[itemId] || []), photoData]
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const stats = getProgressStats();
  return <div className="min-h-screen bg-gradient-to-br from-industrial-50 to-safety-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {onBack && <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>}
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-industrial-900">
            {checklistTypeLabels[checklistType]}
          </h1>
          <p className="text-industrial-600">
            {checklistType === 'empilhadeira' ? 'Inspeção obrigatória antes da operação' : 'Inspeção obrigatória do acessório de içamento'}
          </p>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-industrial-900">{stats.progress}%</div>
              <div className="text-sm text-industrial-600">Progresso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-safety-green">{stats.conforme}</div>
              <div className="text-sm text-industrial-600">OK</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-safety-red">{stats.naoConforme}</div>
              <div className="text-sm text-industrial-600">NOK</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-industrial-900">{stats.answered}/{stats.total}</div>
              <div className="text-sm text-industrial-600">Itens</div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Scanner - only for empilhadeira */}
        {checklistType === 'empilhadeira' && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Identificação por QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning && !qrScanned && <Button onClick={startQRScanning} className="w-full" variant="outline">
                  📱 Escanear QR Code do Equipamento
                </Button>}
              
              {isScanning && <div className="space-y-4">
                  <div className="relative w-full max-w-md mx-auto">
                    <video ref={videoRef} className="w-full rounded-lg" playsInline muted />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Posicione o QR code dentro da área de escaneamento
                  </p>
                  <Button onClick={stopQRScanning} variant="destructive" className="w-full">
                    Parar Escaneamento
                  </Button>
                </div>}
              
              {qrScanned && <div className="text-center p-4 bg-safety-green-light rounded-lg">
                  <span className="text-safety-green font-medium">✓ QR Code Escaneado com Sucesso</span>
                </div>}
            </CardContent>
          </Card>}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operator-name">Nome do Operador *</Label>
                <Input id="operator-name" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Digite seu nome completo" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator-id">Matrícula/ID *</Label>
                  <Input id="operator-id" value={operatorId} onChange={e => setOperatorId(e.target.value)} placeholder="Digite sua matrícula" disabled />
              </div>
            </div>
            
            {checklistType === 'empilhadeira' ? <>
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipamento *</Label>
                  <Select value={selectedEquipment} onValueChange={value => {
                setSelectedEquipment(value);
                // Auto-preencher dados do equipamento selecionado
                const equipment = equipments.find(eq => eq.id === value);
                if (equipment) {
                  setEquipmentModel(equipment.model.toLowerCase().includes('eletrica') ? 'eletrica' : 'combustao');
                  setLocation(equipment.location || equipment.sector);
                  setEquipmentSeries(equipment.equipmentSeries || `${equipment.brand}-${equipment.model}`);
                  setEquipmentNumber(equipment.equipmentNumber || equipment.code);
                  setUnit(equipment.unit as "01" | "02" | "03" || "01");
                }
              }} disabled={qrScanned}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipments.map(equipment => <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.code} - {equipment.brand} {equipment.model} ({equipment.sector})
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  

                  <div className="space-y-2">
                    <Label htmlFor="location">Local *</Label>
                    <Select value={location} onValueChange={setLocation} disabled={qrScanned}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AD01">AD 01</SelectItem>
                        <SelectItem value="AD02">AD 02</SelectItem>
                        <SelectItem value="CD01">CD 01</SelectItem>
                        <SelectItem value="CD02">CD 02</SelectItem>
                        <SelectItem value="VEI01">Veículos 01</SelectItem>
                        <SelectItem value="VEI02">Veículos 02</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unidade *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="01" checked={unit === "01"} onChange={e => setUnit(e.target.value as "01")} disabled={qrScanned} />
                        <span>01</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="02" checked={unit === "02"} onChange={e => setUnit(e.target.value as "02")} disabled={qrScanned} />
                        <span>02</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="03" checked={unit === "03"} onChange={e => setUnit(e.target.value as "03")} disabled={qrScanned} />
                        <span>03</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="series">Série da Empilhadeira *</Label>
                    <Input id="series" value={equipmentSeries} onChange={e => setEquipmentSeries(e.target.value)} placeholder="Ex: ABC123" disabled={qrScanned} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número de Identificação *</Label>
                    <Input id="number" value={equipmentNumber} onChange={e => setEquipmentNumber(e.target.value)} placeholder="Ex: EMP-001" disabled={qrScanned} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hour-meter">Horímetro Atual *</Label>
                    <Input id="hour-meter" type="number" value={hourMeter} onChange={e => setHourMeter(e.target.value)} placeholder="Ex: 1250" />
                  </div>
                </div>
              </> : <>
                <div className="space-y-2">
                  <Label htmlFor="operation-description">Descrição da Operação *</Label>
                  <Textarea id="operation-description" value={operationDescription} onChange={e => setOperationDescription(e.target.value)} placeholder="Descreva detalhadamente a operação que irá realizar..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="load-description">Carga a ser Içada *</Label>
                  <Input id="load-description" value={loadDescription} onChange={e => setLoadDescription(e.target.value)} placeholder="Ex: Bobina de aço 2000kg, Viga metálica 500kg..." />
                </div>
              </>}
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Itens de Verificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-industrial-800 border-b pb-2">{category}</h3>
                <div className="space-y-3">
                  {items.map(item => <div key={item.id} className={`bg-white p-4 rounded-lg border space-y-3 ${criticalItems.includes(item.id) ? 'border-l-4 border-l-safety-orange bg-safety-orange-light/10' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {criticalItems.includes(item.id) && <AlertTriangle className="w-5 h-5 text-safety-orange" />}
                            <p className="font-medium text-industrial-900">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.required && <Badge variant="outline">Obrigatório</Badge>}
                            {criticalItems.includes(item.id) && <Badge className="bg-safety-orange text-white text-xs">CRÍTICO</Badge>}
                          </div>
                        </div>
                        {answers[item.id] && getAnswerBadge(answers[item.id].value)}
                      </div>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name={`item-${item.id}`} value="sim" checked={answers[item.id]?.value === 'sim'} onChange={() => handleAnswerChange(item.id, 'sim')} />
                          <span>OK</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name={`item-${item.id}`} value="nao" checked={answers[item.id]?.value === 'nao'} onChange={() => handleAnswerChange(item.id, 'nao')} />
                          <span>NOK</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name={`item-${item.id}`} value="nao_aplica" checked={answers[item.id]?.value === 'nao_aplica'} onChange={() => handleAnswerChange(item.id, 'nao_aplica')} />
                          <span>N/A</span>
                        </label>
                      </div>

                      {answers[item.id]?.value === 'nao' && <div className="space-y-2">
                          <Label htmlFor={`observation-${item.id}`}>Observação (obrigatória para NOK)</Label>
                          <Textarea id={`observation-${item.id}`} value={answers[item.id]?.observation || ""} onChange={e => handleObservationChange(item.id, e.target.value)} placeholder="Descreva o problema encontrado..." className="min-h-[60px]" />
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`photo-${item.id}`} className="flex items-center gap-2 cursor-pointer text-sm">
                              <Camera className="w-4 h-4" />
                              Anexar foto do defeito
                            </Label>
                            <input id={`photo-${item.id}`} type="file" accept="image/*" onChange={e => handlePhotoUpload(item.id, e)} className="hidden" />
                          </div>
                          {photos[item.id] && <PhotoGrid photos={photos[item.id]} className="mt-2" maxVisible={4} />}
                        </div>}
                    </div>)}
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Assinatura Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas ref={canvasRef} width={600} height={200} className="w-full h-48 border rounded cursor-crosshair bg-white touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{
              touchAction: 'none'
            }} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearSignature}>
                Limpar Assinatura
              </Button>
              {signature && <Badge className="bg-safety-green text-white">✓ Assinatura capturada</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="p-6">
            <Button onClick={handleSubmit} className="w-full h-12 text-lg" disabled={stats.progress < 100 || !signature}>
              {stats.progress < 100 ? `Complete o checklist (${stats.progress}%)` : !signature ? "Adicione sua assinatura" : "Finalizar Checklist"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={open => {
      if (!open) return;
    }}>
        <DialogContent className="max-w-md mx-auto" onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
          <div className="bg-green-500 text-white p-8 rounded-lg text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                {checklistType === 'empilhadeira' ? 'Equipamento liberado para uso!' : 'Acessório aprovado para uso!'}
              </h2>
              <p className="text-lg">Bom trabalho!</p>
              <div className="flex justify-center">
                <img src={forkliftWorkingImage} alt="Empilhadeira trabalhando" className="w-32 h-32 object-contain bg-white rounded-lg p-2" />
              </div>
              <Button onClick={handleDialogClose} className="bg-white text-green-500 hover:bg-gray-100 font-semibold px-8 py-2">
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Itens Críticos */}
      <Dialog open={showCriticalDialog} onOpenChange={open => {
      if (!open) return;
    }}>
        <DialogContent className="max-w-md mx-auto" onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
          <div className="bg-red-500 text-white p-8 rounded-lg text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <img src={mechanicIcon} alt="Mecânico" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                ⚠️ ITEM NÃO CONFORME DETECTADO
              </h2>
              <p className="text-lg font-semibold">
                {checklistType === 'empilhadeira' ? 'Equipamento paralisado. Favor encaminhar para oficina.' : 'Operação paralisada. Favor entrar em contato com o SEMEST.'}
              </p>
              <Button onClick={handleDialogClose} className="bg-white text-red-500 hover:bg-gray-100 font-semibold px-8 py-2">
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default ChecklistForm;