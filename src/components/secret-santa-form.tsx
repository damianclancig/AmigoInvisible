
'use client';

import { useState, type FormEvent, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { processSecretSanta } from '@/app/actions';
import type { Participant, ServerActionResponse, AssignmentLogEntry, ExclusionRule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Gift, UsersRound, MailCheck, PlusCircle, Trash2, Loader2, FileTextIcon, InfoIcon, AlertTriangle, CheckCircle2, UserX, Shuffle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function SecretSantaForm() {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunLogs, setLastRunLogs] = useState<AssignmentLogEntry[] | undefined>(undefined);

  const [exclusions, setExclusions] = useState<ExclusionRule[]>([]);
  const [exclusionParticipant1Id, setExclusionParticipant1Id] = useState<string | undefined>(undefined);
  const [exclusionParticipant2Id, setExclusionParticipant2Id] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();

  const resetFormStateOnParticipantChange = () => {
    setLastRunLogs(undefined);
    // No reseteamos las exclusiones aquí, se manejarán al eliminar participantes.
  };

  const handleAddParticipant = () => {
    if (!currentName.trim() || !currentEmail.trim()) {
      toast({ title: 'Error', description: 'El nombre y el correo del participante no pueden estar vacíos.', variant: 'destructive' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(currentEmail)) {
      toast({ title: 'Error', description: 'Por favor, introduce una dirección de correo válida.', variant: 'destructive' });
      return;
    }
    if (participants.find(p => p.email.toLowerCase() === currentEmail.trim().toLowerCase())) {
      toast({ title: 'Error', description: 'Esta dirección de correo ya ha sido añadida.', variant: 'destructive' });
      return;
    }

    setParticipants([...participants, { id: crypto.randomUUID(), name: currentName.trim(), email: currentEmail.trim() }]);
    setCurrentName('');
    setCurrentEmail('');
    resetFormStateOnParticipantChange();
  };

  const handleParticipantInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleRemoveParticipant = (idToRemove: string) => {
    setParticipants(prev => prev.filter(p => p.id !== idToRemove));
    // Eliminar reglas de exclusión que involucren a este participante
    setExclusions(prevExclusions => prevExclusions.filter(ex => ex.participant1Id !== idToRemove && ex.participant2Id !== idToRemove));
    resetFormStateOnParticipantChange();
  };

  const handleAddExclusion = () => {
    if (!exclusionParticipant1Id || !exclusionParticipant2Id) {
      toast({ title: 'Error', description: 'Debes seleccionar dos participantes para crear una exclusión.', variant: 'destructive' });
      return;
    }
    if (exclusionParticipant1Id === exclusionParticipant2Id) {
      toast({ title: 'Error', description: 'No puedes excluir a un participante consigo mismo.', variant: 'destructive' });
      return;
    }

    const existingExclusion = exclusions.find(
      ex =>
        (ex.participant1Id === exclusionParticipant1Id && ex.participant2Id === exclusionParticipant2Id) ||
        (ex.participant1Id === exclusionParticipant2Id && ex.participant2Id === exclusionParticipant1Id)
    );

    if (existingExclusion) {
      toast({ title: 'Información', description: 'Esta exclusión ya existe.', variant: 'default' });
      return;
    }

    const p1 = participants.find(p => p.id === exclusionParticipant1Id);
    const p2 = participants.find(p => p.id === exclusionParticipant2Id);

    if (!p1 || !p2) {
       toast({ title: 'Error', description: 'Participantes no encontrados.', variant: 'destructive' });
       return;
    }

    setExclusions([...exclusions, { 
      id: crypto.randomUUID(), 
      participant1Id: exclusionParticipant1Id, 
      participant2Id: exclusionParticipant2Id,
      participant1Name: p1.name,
      participant2Name: p2.name,
    }]);
    setExclusionParticipant1Id(undefined);
    setExclusionParticipant2Id(undefined);
    resetFormStateOnParticipantChange();
  };

  const handleRemoveExclusion = (idToRemove: string) => {
    setExclusions(exclusions.filter(ex => ex.id !== idToRemove));
    resetFormStateOnParticipantChange();
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      toast({ title: 'Error', description: 'El título del evento es obligatorio.', variant: 'destructive' });
      return;
    }
    if (participants.length < 2) {
      toast({ title: 'Error', description: 'Necesitas al menos dos participantes.', variant: 'destructive' });
      return;
    }
    if (participants.length < 3 && exclusions.length > 0) {
      toast({ title: 'Error', description: 'No se pueden aplicar exclusiones con menos de 3 participantes.', variant: 'destructive'});
      return;
    }


    setIsLoading(true);
    setLastRunLogs(undefined);
    try {
      const result: ServerActionResponse = await processSecretSanta(eventTitle, eventDescription, participants, exclusions);
      if (result.success) { 
        toast({
          title: result.assignmentsLog?.every(log => log.sendStatus === 'enviado') ? '¡Éxito!' : (result.assignmentsLog?.some(log => log.sendStatus === 'fallido') ? 'Sorteo Realizado con Alertas' : 'Sorteo Realizado'),
          description: result.message,
          duration: 9000, 
          variant: result.assignmentsLog?.some(log => log.sendStatus === 'fallido' || log.sendStatus === 'no_configurado') ? 'default' : 'default', 
        });
        setLastRunLogs(result.assignmentsLog);
      } else { 
        toast({ title: 'Error en el Sorteo', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error procesando Amigo Invisible:", error);
      toast({ title: 'Error Inesperado', description: 'Ocurrió un error inesperado al procesar el sorteo. Por favor, inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getParticipantNameById = (id: string): string => {
    return participants.find(p => p.id === id)?.name || 'Desconocido';
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="text-center mb-10">
        <Gift className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
          Secret Santa Sorter
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          ¡Organiza tu intercambio de Amigo Invisible con facilidad y reglas personalizadas!
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <FileTextIcon className="h-6 w-6 text-primary" />
              Detalles del Evento
            </CardTitle>
            <CardDescription>Define el título y un mensaje amigable para tu evento de Amigo Invisible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="eventTitle" className="text-sm font-medium">Título del Evento</Label>
              <Input
                id="eventTitle"
                type="text"
                value={eventTitle}
                onChange={(e) => { setEventTitle(e.target.value); resetFormStateOnParticipantChange(); }}
                placeholder="Ej: Intercambio Navideño de la Oficina"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventDescription" className="text-sm font-medium">Descripción del Evento (Opcional)</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => { setEventDescription(e.target.value); resetFormStateOnParticipantChange();}}
                placeholder="Ej: Presupuesto, fecha del intercambio, temática..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <UsersRound className="h-6 w-6 text-primary" />
              Participantes
            </CardTitle>
            <CardDescription>Añade a todos los que participarán en el intercambio. ¡Necesitas al menos dos!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="participantName" className="text-sm font-medium">Nombre</Label>
                <Input
                  id="participantName"
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyDown={handleParticipantInputKeyDown}
                  placeholder="Nombre del Participante"
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="participantEmail" className="text-sm font-medium">Correo Electrónico</Label>
                <Input
                  id="participantEmail"
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyDown={handleParticipantInputKeyDown}
                  placeholder="participante@ejemplo.com"
                  className="mt-1"
                />
              </div>
              <Button type="button" onClick={handleAddParticipant} variant="secondary" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Participante
              </Button>
            </div>
            
            {participants.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-md font-medium text-foreground">Participantes Añadidos ({participants.length}):</h3>
                <Separator />
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm">
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <Button type="button" onClick={() => handleRemoveParticipant(p.id)} variant="ghost" size="icon" aria-label="Eliminar participante">
                        <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {participants.length < 2 && participants.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-center gap-2">
                    <InfoIcon className="h-5 w-5"/>
                    Por favor, añade al menos {2 - participants.length} participante(s) más.
                </div>
            )}
          </CardContent>
        </Card>

        {participants.length >= 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <UserX className="h-6 w-6 text-primary" />
                Reglas de Exclusión (Opcional)
              </CardTitle>
              <CardDescription>Define qué participantes NO deben regalarse entre sí. Necesitas al menos 3 participantes en total para aplicar exclusiones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.length < 3 ? (
                <div className="p-3 bg-muted/30 border border-border rounded-md text-sm text-muted-foreground flex items-center gap-2">
                  <InfoIcon className="h-5 w-5" />
                  Añade al menos 3 participantes para poder crear reglas de exclusión.
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="exclusionP1" className="text-sm font-medium">Participante A</Label>
                      <Select value={exclusionParticipant1Id} onValueChange={setExclusionParticipant1Id}>
                        <SelectTrigger id="exclusionP1" className="mt-1">
                          <SelectValue placeholder="Selecciona un participante" />
                        </SelectTrigger>
                        <SelectContent>
                          {participants
                            .filter(p => p.id !== exclusionParticipant2Id) // No puede ser igual al P2
                            .map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="exclusionP2" className="text-sm font-medium">No regala a (Participante B)</Label>
                      <Select value={exclusionParticipant2Id} onValueChange={setExclusionParticipant2Id}>
                        <SelectTrigger id="exclusionP2" className="mt-1">
                          <SelectValue placeholder="Selecciona un participante" />
                        </SelectTrigger>
                        <SelectContent>
                          {participants
                            .filter(p => p.id !== exclusionParticipant1Id) // No puede ser igual al P1
                            .map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={handleAddExclusion} variant="secondary" className="w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Exclusión
                    </Button>
                  </div>

                  {exclusions.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-md font-medium text-foreground">Exclusiones Activas ({exclusions.length}):</h3>
                      <Separator />
                      <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {exclusions.map((ex) => (
                          <li key={ex.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm text-sm">
                            <div>
                              <span className="font-medium">{ex.participant1Name || getParticipantNameById(ex.participant1Id)}</span>
                              <span className="text-muted-foreground"> no se regala con </span>
                              <span className="font-medium">{ex.participant2Name || getParticipantNameById(ex.participant2Id)}</span>
                            </div>
                            <Button type="button" onClick={() => handleRemoveExclusion(ex.id)} variant="ghost" size="icon" aria-label="Eliminar exclusión">
                              <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}


        <Button 
          type="submit" 
          disabled={isLoading || participants.length < 2 || (participants.length < 3 && exclusions.length > 0)} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-lg font-semibold shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <Shuffle className="mr-2 h-5 w-5" /> ¡Sortear Amigo Invisible!
            </>
          )}
        </Button>
      </form>

      {lastRunLogs && lastRunLogs.length > 0 && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-primary" />
              Resultado del Envío de Correos
            </CardTitle>
            <CardDescription>
              Detalle del intento de envío de correos para la última ejecución.
              Si ves "no_configurado", asegúrate de haber añadido EMAIL_USER y EMAIL_PASS a tus variables de entorno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {lastRunLogs.map((log, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 w-full">
                      {log.sendStatus === 'enviado' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {log.sendStatus === 'fallido' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {log.sendStatus === 'no_configurado' && <InfoIcon className="h-5 w-5 text-yellow-500" />}
                      <span className="font-medium">{log.giverName} ({log.giverEmail})</span>
                      <span className="ml-auto text-sm px-2 py-1 rounded-md bg-muted">
                        {log.sendStatus === 'enviado' ? 'Enviado' : (log.sendStatus === 'fallido' ? 'Fallido' : 'No Configurado')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p><strong>Destinatario (Amigo Invisible):</strong> {log.receiverName}</p>
                    {log.sendStatus === 'fallido' && log.sendError && (
                       <p className="text-red-600"><strong>Error:</strong> {log.sendError}</p>
                    )}
                    {log.sendStatus === 'no_configurado' && (
                       <p className="text-yellow-600"><strong>Nota:</strong> El envío real no se intentó porque las credenciales de correo (EMAIL_USER, EMAIL_PASS) no están configuradas en el servidor. El correo se simuló en la consola del servidor.</p>
                    )}
                    <p><strong>Asunto:</strong> {log.emailSubject}</p>
                    <div>
                      <strong>Cuerpo del Correo (HTML):</strong>
                      <div className="mt-1 p-2 border rounded-md max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 text-xs" dangerouslySetInnerHTML={{ __html: log.emailBodyHtml }} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <footer className="text-center mt-12 py-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Secret Santa Sorter. ¡Felices Regalos!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Recuerda configurar tus variables de entorno EMAIL_USER y EMAIL_PASS para el envío real de correos.
        </p>
      </footer>
    </div>
  );
}
