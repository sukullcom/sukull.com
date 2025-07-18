"use client";

import { useState, useEffect, useCallback } from "react";
import { challenges, lessons, challengeOptions } from "@/db/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import Image from "next/image";
import { 
  Plus, Settings, Trash2, Target, Clock, 
  Move, Type, Shuffle, MousePointer, CheckSquare, Edit, ImageIcon
} from "lucide-react";
import { 
  createChallenge, 
  deleteChallenge, 
  getChallengesForCourse, 
  getLessonsForCourse,
  createChallengeOptions,
  updateChallenge,
  updateChallengeOptions
} from "../actions";
import { toast } from "sonner";

type Challenge = typeof challenges.$inferSelect & {
  lesson?: typeof lessons.$inferSelect & {
    unit?: { id: number; title: string; };
  };
  challengeOptions?: (typeof challengeOptions.$inferSelect)[];
};

type Lesson = typeof lessons.$inferSelect & {
  unit?: { id: number; title: string; };
};

type ChallengeOption = {
  id?: number;
  text?: string; // Make text optional since images can replace text
  correct: boolean;
  correctOrder?: number | null;
  pairId?: number | null;
  isBlank?: boolean | null;
  dragData?: string | null;
  imageSrc?: string | null; // Add image support for options
  audioSrc?: string | null; // Add audio support for options
};

const CHALLENGE_TYPES = [
  { value: "SELECT", label: "Çoktan Seçmeli", icon: CheckSquare, color: "bg-blue-100 text-blue-700" },
  { value: "ASSIST", label: "Tanım Eşleştirme", icon: Target, color: "bg-green-100 text-green-700" },
  { value: "DRAG_DROP", label: "Sürükle Bırak", icon: MousePointer, color: "bg-purple-100 text-purple-700" },
  { value: "FILL_BLANK", label: "Boşluk Doldurma", icon: Type, color: "bg-orange-100 text-orange-700" },
  { value: "MATCH_PAIRS", label: "Çift Eşleştirme", icon: Shuffle, color: "bg-pink-100 text-pink-700" },
  { value: "SEQUENCE", label: "Sıralama", icon: Move, color: "bg-indigo-100 text-indigo-700" },
  { value: "TIMER_CHALLENGE", label: "Zamanlı Zorluk", icon: Clock, color: "bg-red-100 text-red-700" },
];

interface ChallengeManagerProps {
  courseId: number;
  courseName: string;
  onChallengeCreated?: () => void; // Add callback prop
}

export function ChallengeManager({ courseId, courseName, onChallengeCreated }: ChallengeManagerProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>("");
  const [editChallengeType, setEditChallengeType] = useState<string>("");
  const [newChallenge, setNewChallenge] = useState({
    lessonId: 0,
    type: "",
    question: "",
    order: 1,
    timeLimit: undefined as number | undefined,
    metadata: "",
    questionImageSrc: "" // Fixed property name
  });
  const [editChallenge, setEditChallenge] = useState({
    type: "",
    question: "",
    order: 1,
    timeLimit: undefined as number | undefined,
    metadata: "",
    questionImageSrc: "" // Fixed property name
  });
  const [challengeOptions, setChallengeOptions] = useState<ChallengeOption[]>([]);
  const [editChallengeOptions, setEditChallengeOptions] = useState<ChallengeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  const loadData = useCallback(async () => {
    setLoadingChallenges(true);
    try {
      const [challengesResult, lessonsResult] = await Promise.all([
        getChallengesForCourse(courseId),
        getLessonsForCourse(courseId)
      ]);

      if (challengesResult.success && challengesResult.challenges) {
        setChallenges(challengesResult.challenges);
      } else {
        toast.error(challengesResult.error || "Zorluklar yüklenemedi");
      }

      if (lessonsResult.success && lessonsResult.lessons) {
        setLessons(lessonsResult.lessons);
      } else {
        toast.error(lessonsResult.error || "Dersler yüklenemedi");
      }
    } catch {
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoadingChallenges(false);
    }
  }, [courseId]);

  // Load challenges and lessons when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize lesson selection when lessons are loaded
  useEffect(() => {
    if (lessons.length > 0 && newChallenge.lessonId === 0) {
      const firstLesson = lessons[0];
      const challengesInLesson = challenges.filter(c => c.lesson?.id === firstLesson.id);
      setNewChallenge(prev => ({
        ...prev,
        lessonId: firstLesson.id,
        order: challengesInLesson.length + 1
      }));
    }
  }, [lessons, challenges, newChallenge.lessonId]);

  const handleTypeChange = (type: string) => {
    setSelectedChallengeType(type);
    setNewChallenge(prev => ({
      ...prev,
      type,
      timeLimit: type === "TIMER_CHALLENGE" ? 60 : undefined
    }));
    // Initialize challenge options immediately when type is selected
    initializeChallengeOptions(type);
  };

  const handleEditTypeChange = (type: string) => {
    setEditChallengeType(type);
    setEditChallenge(prev => ({
      ...prev,
      type,
      timeLimit: type === "TIMER_CHALLENGE" ? (prev.timeLimit || 60) : prev.timeLimit
    }));
    // Initialize challenge options for editing
    initializeEditChallengeOptions(type);
  };

  const openEditDialog = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setEditChallenge({
      type: challenge.type,
      question: challenge.question,
      order: challenge.order,
      timeLimit: challenge.timeLimit || undefined,
      metadata: challenge.metadata || "",
      questionImageSrc: challenge.questionImageSrc || "" // Fixed property name
    });
    setEditChallengeType(challenge.type);
    
    // Initialize edit options with existing challenge options
    if (challenge.challengeOptions) {
      setEditChallengeOptions(challenge.challengeOptions.map(opt => ({
        ...opt,
        // Convert database fields to form fields
        correctOrder: opt.correctOrder,
        pairId: opt.pairId,
        isBlank: opt.isBlank,
        dragData: opt.dragData
      })));
    } else {
      initializeEditChallengeOptions(challenge.type);
    }
    
    setIsEditOpen(true);
  };

  const handleEditChallenge = async () => {
    if (!editingChallenge || !editChallenge.question.trim()) {
      toast.error("Zorluk sorusu gereklidir");
      return;
    }
    if (!editChallenge.type) {
      toast.error("Lütfen bir zorluk türü seçin");
      return;
    }

    // Validate options based on challenge type
    const validationResult = validateChallengeOptions(editChallenge.type, editChallengeOptions);
    
    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Update the challenge
      const challengeResult = await updateChallenge(editingChallenge.id, {
        type: editChallenge.type,
        question: editChallenge.question,
        order: editChallenge.order,
        timeLimit: editChallenge.timeLimit,
        metadata: editChallenge.metadata,
        questionImageSrc: editChallenge.questionImageSrc // Fixed property name
      });
      
      if (challengeResult.success) {
        // Step 2: Update the challenge options
        const convertedOptions = editChallengeOptions.map(opt => ({
          id: opt.id,
          text: opt.text,
          correct: opt.correct,
          imageSrc: opt.imageSrc || undefined, // Convert null to undefined
          audioSrc: opt.audioSrc || undefined, // Add audioSrc field
          correctOrder: opt.correctOrder ?? undefined,
          pairId: opt.pairId ?? undefined,
          isBlank: opt.isBlank ?? undefined,
          dragData: opt.dragData ?? undefined
        }));
        const optionsResult = await updateChallengeOptions(editingChallenge.id, convertedOptions);
        
        if (optionsResult.success) {
          setIsEditOpen(false);
          setEditingChallenge(null);
          setEditChallengeOptions([]);
          await loadData();
          
          toast.success("Zorluk başarıyla güncellendi!");
          if (onChallengeCreated) {
            onChallengeCreated();
          }
        } else {
          toast.error(optionsResult.error || "Zorluk güncellendi ancak seçenekler güncellenemedi");
        }
      } else {
        toast.error(challengeResult.error || "Zorluk güncellenemedi");
      }
    } catch {
      toast.error("Zorluk güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallengeWithOptions = async () => {
    if (!newChallenge.question.trim()) {
      toast.error("Zorluk sorusu gereklidir");
      return;
    }
    if (!newChallenge.type) {
      toast.error("Lütfen bir zorluk türü seçin");
      return;
    }
    if (!newChallenge.lessonId) {
      toast.error("Lütfen bir ders seçin");
      return;
    }

    // Validate options based on challenge type
    const validationResult = validateChallengeOptions(newChallenge.type, challengeOptions);
    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create the challenge
      const challengeResult = await createChallenge({
        lessonId: newChallenge.lessonId,
        type: newChallenge.type,
        question: newChallenge.question,
        order: newChallenge.order,
        timeLimit: newChallenge.timeLimit,
        metadata: newChallenge.metadata,
        questionImageSrc: newChallenge.questionImageSrc // Fixed property name
      });
      
      if (challengeResult.success && challengeResult.challenge) {
        // Step 2: Create the challenge options
        const convertedOptions = challengeOptions.map(opt => ({
          text: opt.text,
          correct: opt.correct,
          imageSrc: opt.imageSrc || undefined, // Convert null to undefined
          audioSrc: opt.audioSrc || undefined, // Add audioSrc field
          correctOrder: opt.correctOrder ?? undefined,
          pairId: opt.pairId ?? undefined,
          isBlank: opt.isBlank ?? undefined,
          dragData: opt.dragData ?? undefined
        }));
        const optionsResult = await createChallengeOptions(challengeResult.challenge.id, convertedOptions);
        
        if (optionsResult.success) {
          setIsCreateOpen(false);
          setChallengeOptions([]);
          await loadData();
          
          // Reset form
          setNewChallenge({ 
            lessonId: newChallenge.lessonId,
            type: "",
            question: "",
            order: challenges.filter(c => c.lesson?.id === newChallenge.lessonId).length + 2,
            timeLimit: undefined,
            metadata: "",
            questionImageSrc: "" // Fixed property name
          });
          setSelectedChallengeType("");
          
          toast.success("Zorluk tüm seçenekleriyle birlikte başarıyla oluşturuldu!");
          if (onChallengeCreated) {
            onChallengeCreated();
          }
        } else {
          toast.error(optionsResult.error || "Zorluk oluşturuldu ancak seçenekler eklenemedi");
        }
      } else {
        toast.error(challengeResult.error || "Zorluk oluşturulamadı");
      }
    } catch {
      toast.error("Zorluk oluşturulurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!window.confirm("Bu zorluğu silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const result = await deleteChallenge(challengeId);
      if (result.success) {
        await loadData();
        toast.success("Zorluk başarıyla silindi");
        if (onChallengeCreated) {
          onChallengeCreated();
        }
      } else {
        toast.error(result.error || "Zorluk silinemedi");
      }
    } catch {
      toast.error("Zorluk silinirken bir hata oluştu");
    }
  };

  const handleLessonChange = (lessonId: string) => {
    const selectedLessonId = parseInt(lessonId);
    const challengesInLesson = challenges.filter(c => c.lesson?.id === selectedLessonId);
    setNewChallenge({ 
      ...newChallenge, 
      lessonId: selectedLessonId,
      order: challengesInLesson.length + 1 
    });
  };

  const getChallengeTypeInfo = (type: string) => {
    return CHALLENGE_TYPES.find(t => t.value === type) || CHALLENGE_TYPES[0];
  };

  const initializeChallengeOptions = (type: string) => {
    switch (type) {
      case "SELECT":
      case "ASSIST": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "DRAG_DROP": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "item", itemId: 1 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "item", itemId: 2 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "zone", zoneId: "zone1", correctItemId: 1 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "zone", zoneId: "zone2", correctItemId: 2 }) },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "FILL_BLANK": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", isBlank: true },
          { text: "", correct: false, imageSrc: "", audioSrc: "", isBlank: true },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "MATCH_PAIRS": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 2 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 2 },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "SEQUENCE": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 2 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 3 },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "TIMER_CHALLENGE": {
        setChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      default:
        setChallengeOptions([]);
    }
  };

  const initializeEditChallengeOptions = (type: string) => {
    switch (type) {
      case "SELECT":
      case "ASSIST": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "DRAG_DROP": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "item", itemId: 1 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "item", itemId: 2 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "zone", zoneId: "zone1", correctItemId: 1 }) },
          { text: "", correct: false, imageSrc: "", audioSrc: "", dragData: JSON.stringify({ type: "zone", zoneId: "zone2", correctItemId: 2 }) },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "FILL_BLANK": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", isBlank: true },
          { text: "", correct: false, imageSrc: "", audioSrc: "", isBlank: true },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "MATCH_PAIRS": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 2 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: 2 },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "SEQUENCE": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 1 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 2 },
          { text: "", correct: false, imageSrc: "", audioSrc: "", correctOrder: 3 },
          { text: "Correct", correct: true, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      case "TIMER_CHALLENGE": {
        setEditChallengeOptions([
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" },
          { text: "", correct: false, imageSrc: "", audioSrc: "" }
        ]);
        break;
      }
      default:
        setEditChallengeOptions([]);
    }
  };

  const validateChallengeOptions = (type: string, options: ChallengeOption[]) => {
    switch (type) {
      case "SELECT":
      case "ASSIST": {
        const hasCorrectAnswer = options.some(opt => opt.correct && opt.text?.trim());
        const hasEnoughOptions = options.filter(opt => opt.text?.trim()).length >= 2;
        
        if (!hasCorrectAnswer) return { isValid: false, message: "Lütfen bir seçeneği doğru olarak işaretleyin" };
        if (!hasEnoughOptions) return { isValid: false, message: "Lütfen en az 2 seçenek sağlayın" };
        break;
      }
      case "DRAG_DROP": {
        const items = options.filter(opt => opt.dragData && JSON.parse(opt.dragData).type === "item");
        const zones = options.filter(opt => opt.dragData && JSON.parse(opt.dragData).type === "zone");
        
        // Check if items have either text or image
        const validItems = items.filter(item => item.text?.trim() || item.imageSrc?.trim());
        if (validItems.length < 2) return { isValid: false, message: "Lütfen en az 2 sürüklenebilir öğe sağlayın (metin veya resim)" };
        if (zones.length < 2) return { isValid: false, message: "Lütfen en az 2 bırakma alanı sağlayın" };
        break;
      }
      case "FILL_BLANK": {
        const blanks = options.filter(opt => opt.isBlank && opt.text?.trim());
        if (blanks.length === 0) return { isValid: false, message: "Lütfen boşluklar için cevaplar sağlayın" };
        break;
      }
      case "MATCH_PAIRS": {
        // Check if pairs have either text or image
        const pairs = options.filter(opt => opt.pairId && (opt.text?.trim() || opt.imageSrc?.trim()));
        if (pairs.length < 4) return { isValid: false, message: "Lütfen en az 2 çift (4 öğe) sağlayın (metin veya resim)" };
        break;
      }
      case "SEQUENCE": {
        // Check if sequence items have either text or image
        const sequenceItems = options.filter(opt => opt.correctOrder && (opt.text?.trim() || opt.imageSrc?.trim()));
        if (sequenceItems.length < 2) return { isValid: false, message: "Lütfen en az 2 sıralama öğesi sağlayın (metin veya resim)" };
        break;
      }
      case "TIMER_CHALLENGE": {
        const timerCorrect = options.some(opt => opt.correct && opt.text?.trim());
        const timerOptions = options.filter(opt => opt.text?.trim()).length >= 2;
        if (!timerCorrect) return { isValid: false, message: "Lütfen bir seçeneği doğru olarak işaretleyin" };
        if (!timerOptions) return { isValid: false, message: "Lütfen en az 2 seçenek sağlayın" };
        break;
      }
    }
    return { isValid: true };
  };

  if (loadingChallenges) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  // Group challenges by lesson
  const challengesByLesson = lessons.map(lesson => ({
    lesson,
    challenges: challenges.filter(challenge => challenge.lesson?.id === lesson.id)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
          <p className="text-gray-600">Manage challenges for {courseName}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={lessons.length === 0} 
              onClick={() => {
                setIsCreateOpen(true);
                if (onChallengeCreated) {
                  onChallengeCreated();
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-dialog="challenge-creation">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lesson">Lesson</Label>
                  <Select value={newChallenge.lessonId.toString()} onValueChange={handleLessonChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                          {lesson.unit?.title} - {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={newChallenge.order}
                    onChange={(e) => setNewChallenge({ ...newChallenge, order: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>

              {/* Challenge Type Selection */}
              <div>
                <Label>Challenge Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {CHALLENGE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedChallengeType === type.value;
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleTypeChange(type.value)}
                        className={`
                          cursor-pointer p-3 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium text-sm">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.value}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Section with Image Upload */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Soru Metni</Label>
                  <Textarea
                    id="question"
                    value={newChallenge.question}
                    onChange={(e) => setNewChallenge({ ...newChallenge, question: e.target.value })}
                    placeholder="Zorluk sorusunu girin..."
                    rows={3}
                  />
                  {selectedChallengeType === "FILL_BLANK" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Boşlukları işaretlemek için &quot;{"{1}"}&quot;, &quot;{"{2}"}&quot;, vb. kullanın. Örnek: &quot;{"{1}"} verilerini {"{2}"} için kullanılır.&quot;
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="questionImageSrc">Soru Resmi (İsteğe Bağlı)</Label>
                  <ImageUpload
                    value={newChallenge.questionImageSrc}
                    onChange={(url) => setNewChallenge({ ...newChallenge, questionImageSrc: url })}
                    placeholder="Soru için resim yükleyin"
                  />
                </div>
              </div>

              {/* Time Limit (for timer challenges) */}
              {selectedChallengeType === "TIMER_CHALLENGE" && (
                <div>
                  <Label htmlFor="timeLimit">Süre Limiti (saniye)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={newChallenge.timeLimit || 60}
                    onChange={(e) => setNewChallenge({ ...newChallenge, timeLimit: parseInt(e.target.value) || 60 })}
                    min={10}
                    max={300}
                  />
                </div>
              )}

              {/* Challenge Type Instructions */}
              {selectedChallengeType && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {getChallengeTypeInfo(selectedChallengeType).label} Talimatları
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedChallengeType === "SELECT" && (
                      <p>Çoktan seçmeli seçenekler oluşturun. Birini doğru olarak işaretleyin.</p>
                    )}
                    {selectedChallengeType === "ASSIST" && (
                      <p>Tanım eşleştirme seçenekleri oluşturun. Öğrenci soruyu görür ve doğru anlamı seçer.</p>
                    )}
                    {selectedChallengeType === "DRAG_DROP" && (
                      <p>Sürüklenecek öğeler ve bırakma alanları oluşturun. Her öğe belirli bir alana eşlenmelidir.</p>
                    )}
                    {selectedChallengeType === "FILL_BLANK" && (
                      <p>Soruda yer tutucu numaralar kullanın. &quot;isBlank&quot; olarak işaretlenmiş doğru cevaplarla seçenekler oluşturun.</p>
                    )}
                    {selectedChallengeType === "MATCH_PAIRS" && (
                      <p>Eşleşen öğe çiftleri oluşturun. Eşleşen öğeleri gruplamak için pairId kullanın.</p>
                    )}
                    {selectedChallengeType === "SEQUENCE" && (
                      <p>Doğru sıra numaralarıyla öğeler oluşturun. Öğrenciler bunları doğru sırayla düzenler.</p>
                    )}
                    {selectedChallengeType === "TIMER_CHALLENGE" && (
                      <p>Herhangi bir zorluk türüne zaman baskısı ekleyin. Uygun süre limitini ayarlayın.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="primaryOutline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChallengeWithOptions} disabled={isLoading || !selectedChallengeType}>
                  {isLoading ? "Creating..." : "Create Challenge"}
                </Button>
              </div>

              {/* Challenge Options Section - shown when type is selected */}
              {selectedChallengeType && challengeOptions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">
                    Configure {getChallengeTypeInfo(selectedChallengeType).label} Options
                  </h3>
                  <ChallengeOptionsFormInline
                    challengeType={selectedChallengeType}
                    options={challengeOptions}
                    setOptions={setChallengeOptions}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* No lessons warning */}
      {lessons.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <Target className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No lessons available</h3>
          <p className="text-yellow-700 mb-4">You need to create lessons first before adding challenges</p>
          <p className="text-sm text-yellow-600">Go to the Lessons tab to create your first lesson</p>
        </div>
      )}

      {/* Challenges grouped by lesson */}
      {challengesByLesson.map(({ lesson, challenges: lessonChallenges }) => (
        <div key={lesson.id} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              {lesson.unit?.title} - {lesson.title}
            </h3>
            <p className="text-sm text-gray-600">Lesson ID: {lesson.id}</p>
          </div>

          <div className="grid gap-4 ml-6">
            {lessonChallenges.map((challenge) => {
              const typeInfo = getChallengeTypeInfo(challenge.type);
              const Icon = typeInfo.icon;
              
              return (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-base">{challenge.question}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                            {challenge.timeLimit && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {challenge.timeLimit}s
                              </Badge>
                            )}
                            {challenge.questionImageSrc && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Soru Resmi
                              </Badge>
                            )}
                            {(() => {
                              const optionsWithImages = challenge.challengeOptions?.filter(opt => opt.imageSrc)?.length || 0;
                              return optionsWithImages > 0 ? (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  {optionsWithImages} Seçenek Resmi
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-sm text-gray-500">
                            Order: {challenge.order} • ID: {challenge.id} • 
                            Options: {challenge.challengeOptions?.length || 0}
                          </p>
                          
                          {/* Image Previews */}
                          <div className="mt-2 flex items-center space-x-3">
                            {/* Question Image Preview */}
                            {challenge.questionImageSrc && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Soru:</span>
                                <div className="relative w-8 h-8">
                                  <Image
                                    src={challenge.questionImageSrc}
                                    alt="Question image"
                                    fill
                                    sizes="32px"
                                    className="object-contain rounded border"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Option Images Preview */}
                            {(() => {
                              const optionsWithImages = challenge.challengeOptions?.filter(opt => opt.imageSrc) || [];
                              return optionsWithImages.length > 0 ? (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500">Seçenekler:</span>
                                  <div className="flex space-x-1">
                                    {optionsWithImages.slice(0, 3).map((option, index) => (
                                      <div key={index} className="relative w-8 h-8">
                                        <Image
                                          src={option.imageSrc!}
                                          alt={`Option ${index + 1}`}
                                          fill
                                          sizes="32px"
                                          className="object-contain rounded border"
                                        />
                                      </div>
                                    ))}
                                    {optionsWithImages.length > 3 && (
                                      <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                        +{optionsWithImages.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(challenge)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}

            {lessonChallenges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">No challenges in this lesson yet</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* No challenges at all */}
      {challenges.length === 0 && lessons.length > 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges yet</h3>
          <p className="text-gray-600 mb-4">Create your first challenge to get started</p>
          <Button onClick={() => {
            setIsCreateOpen(true);
            if (onChallengeCreated) {
              onChallengeCreated();
            }
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>
      )}

      {/* Edit Challenge Dialog */}
      {editingChallenge && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lesson">Lesson</Label>
                  <Select value={editingChallenge.lesson?.id.toString()} onValueChange={handleLessonChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                          {lesson.unit?.title} - {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={editingChallenge.order}
                    onChange={(e) => setEditChallenge({ ...editChallenge, order: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>

              {/* Challenge Type Selection */}
              <div>
                <Label>Challenge Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {CHALLENGE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = editChallengeType === type.value;
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleEditTypeChange(type.value)}
                        className={`
                          cursor-pointer p-3 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium text-sm">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.value}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Section with Image Upload */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Soru Metni</Label>
                  <Textarea
                    id="question"
                    value={editChallenge.question}
                    onChange={(e) => setEditChallenge({ ...editChallenge, question: e.target.value })}
                    placeholder="Zorluk sorusunu girin..."
                    rows={3}
                  />
                  {editChallengeType === "FILL_BLANK" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Boşlukları işaretlemek için &quot;{"{1}"}&quot;, &quot;{"{2}"}&quot;, vb. kullanın. Örnek: &quot;{"{1}"} verilerini {"{2}"} için kullanılır.&quot;
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="questionImageSrc">Soru Resmi (İsteğe Bağlı)</Label>
                  <ImageUpload
                    value={editChallenge.questionImageSrc}
                    onChange={(url) => setEditChallenge({ ...editChallenge, questionImageSrc: url })}
                    placeholder="Soru için resim yükleyin"
                  />
                </div>
              </div>

              {/* Time Limit (for timer challenges) */}
              {editChallengeType === "TIMER_CHALLENGE" && (
                <div>
                  <Label htmlFor="timeLimit">Süre Limiti (saniye)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={editChallenge.timeLimit || 60}
                    onChange={(e) => setEditChallenge({ ...editChallenge, timeLimit: parseInt(e.target.value) || 60 })}
                    min={10}
                    max={300}
                  />
                </div>
              )}

              {/* Challenge Type Instructions */}
              {editChallengeType && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {getChallengeTypeInfo(editChallengeType).label} Talimatları
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {editChallengeType === "SELECT" && (
                      <p>Çoktan seçmeli seçenekler oluşturun. Birini doğru olarak işaretleyin.</p>
                    )}
                    {editChallengeType === "ASSIST" && (
                      <p>Tanım eşleştirme seçenekleri oluşturun. Öğrenci soruyu görür ve doğru anlamı seçer.</p>
                    )}
                    {editChallengeType === "DRAG_DROP" && (
                      <p>Sürüklenecek öğeler ve bırakma alanları oluşturun. Her öğe belirli bir alana eşlenmelidir.</p>
                    )}
                    {editChallengeType === "FILL_BLANK" && (
                      <p>Soruda yer tutucu numaralar kullanın. &quot;isBlank&quot; olarak işaretlenmiş doğru cevaplarla seçenekler oluşturun.</p>
                    )}
                    {editChallengeType === "MATCH_PAIRS" && (
                      <p>Eşleşen öğe çiftleri oluşturun. Eşleşen öğeleri gruplamak için pairId kullanın.</p>
                    )}
                    {editChallengeType === "SEQUENCE" && (
                      <p>Doğru sıra numaralarıyla öğeler oluşturun. Öğrenciler bunları doğru sırayla düzenler.</p>
                    )}
                    {editChallengeType === "TIMER_CHALLENGE" && (
                      <p>Herhangi bir zorluk türüne zaman baskısı ekleyin. Uygun süre limitini ayarlayın.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="primary" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditChallenge} disabled={isLoading || !editChallengeType}>
                  {isLoading ? "Saving..." : "Save Challenge"}
                </Button>
              </div>

              {/* Challenge Options Section - shown when type is selected */}
              {editChallengeType && editChallengeOptions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">
                    Configure {getChallengeTypeInfo(editChallengeType).label} Options
                  </h3>
                  <ChallengeOptionsFormInline
                    challengeType={editChallengeType}
                    options={editChallengeOptions}
                    setOptions={setEditChallengeOptions}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 

// Inline Challenge Options Form Component (without save/cancel buttons)
interface ChallengeOptionsFormInlineProps {
  challengeType: string;
  options: ChallengeOption[];
  setOptions: (options: ChallengeOption[]) => void;
}

function ChallengeOptionsFormInline({ challengeType, options, setOptions }: ChallengeOptionsFormInlineProps) {
  const updateOption = (index: number, field: string, value: unknown) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const addOption = () => {
    const newOption: ChallengeOption = { text: "", correct: false, imageSrc: "", audioSrc: "" };
    
    switch (challengeType) {
      case "SELECT":
      case "ASSIST":
      case "TIMER_CHALLENGE":
        // correct is already set to false above
        break;
      case "DRAG_DROP": {
        const itemCount = options.filter(opt => opt.dragData && JSON.parse(opt.dragData).type === "item").length;
        newOption.dragData = JSON.stringify({ type: "item", itemId: itemCount + 1 });
        break;
      }
      case "FILL_BLANK":
        newOption.isBlank = true;
        break;
      case "MATCH_PAIRS": {
        const maxPairId = Math.max(...options.filter(opt => opt.pairId).map(opt => opt.pairId!), 0);
        newOption.pairId = maxPairId + 1;
        break;
      }
      case "SEQUENCE": {
        const maxOrder = Math.max(...options.filter(opt => opt.correctOrder).map(opt => opt.correctOrder!), 0);
        newOption.correctOrder = maxOrder + 1;
        break;
      }
    }
    
    setOptions([...options, newOption]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const renderOptionForm = () => {
    switch (challengeType) {
      case "SELECT":
      case "ASSIST":
        return <SelectAssistForm options={options} updateOption={updateOption} removeOption={removeOption} addOption={addOption} setOptions={setOptions} formId="inline" />;
      case "DRAG_DROP":
        return <DragDropForm options={options} updateOption={updateOption} removeOption={removeOption} addOption={addOption} setOptions={setOptions} />;
      case "FILL_BLANK":
        return <FillBlankForm options={options} updateOption={updateOption} removeOption={removeOption} addOption={addOption} setOptions={setOptions} />;
      case "MATCH_PAIRS":
        return <MatchPairsForm options={options} updateOption={updateOption} setOptions={setOptions} />;
      case "SEQUENCE":
        return <SequenceForm options={options} updateOption={updateOption} removeOption={removeOption} addOption={addOption} setOptions={setOptions} />;
      case "TIMER_CHALLENGE":
        return <TimerChallengeForm options={options} updateOption={updateOption} removeOption={removeOption} addOption={addOption} setOptions={setOptions} formId="inline" />;
      default:
        return <div>Unknown challenge type</div>;
    }
  };

  return renderOptionForm();
}

// Individual form components for each challenge type
function SelectAssistForm({ options, updateOption, removeOption, addOption, formId, setOptions }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
  setOptions?: (options: ChallengeOption[]) => void;
  formId?: string;
}) {
  // Use formId to create unique radio button names
  const radioGroupName = `correctAnswer_${formId || 'default'}`;
  
  // Filter out the "Correct" placeholder option but keep actual options
  const displayOptions = options.filter((opt) => opt.text !== "Correct");
  
  const handleCorrectChange = (targetIndex: number) => {
    // Create a new options array with all correct values set to false except the target
    const newOptions = options.map((opt, index) => ({
      ...opt,
      correct: index === targetIndex
    }));
    
    // Use setOptions for proper state management if available
    if (setOptions) {
      setOptions(newOptions);
    } else {
      // Fallback: update each option individually
      options.forEach((_, i) => updateOption(i, "correct", false));
      updateOption(targetIndex, "correct", true);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Multiple Choice Options</h3>
        <Button onClick={addOption} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Option
        </Button>
      </div>
      
      {displayOptions.map((option, displayIndex) => {
        // Find the actual index in the original options array
        const actualIndex = options.findIndex((opt) => opt === option);
        const isChecked = Boolean(option.correct);
        
        return (
          <div key={`option-${actualIndex}-${displayIndex}`} className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Option text"
                value={option.text || ""}
                onChange={(e) => updateOption(actualIndex, "text", e.target.value)}
                className="flex-1"
              />
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={radioGroupName}
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleCorrectChange(actualIndex);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Correct</span>
              </label>
              <Button variant="ghost" size="sm" onClick={() => removeOption(actualIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Option Image (İsteğe Bağlı)</Label>
              <ImageUpload
                value={option.imageSrc || ""}
                onChange={(url) => updateOption(actualIndex, "imageSrc", url)}
                placeholder="Seçenek için resim yükleyin"
                className="mt-1"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DragDropForm({ options, updateOption, removeOption, addOption, setOptions }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
  setOptions: (options: ChallengeOption[]) => void;
}) {
  const items = options.filter((opt) => opt.dragData && JSON.parse(opt.dragData).type === "item");
  const zones = options.filter((opt) => opt.dragData && JSON.parse(opt.dragData).type === "zone");
  
  const addZone = () => {
    const zoneCount = zones.length;
    const newZone = {
      text: "",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: `zone${zoneCount + 1}`, correctItemId: 1 })
    };
    setOptions([...options, newZone]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Drag Items</h3>
          <Button onClick={addOption} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
        
        {items.map((item) => {
          const fullIndex = options.findIndex((opt) => opt === item);
          const dragData = JSON.parse(item.dragData!);
          
          return (
            <div key={fullIndex} className="space-y-3 p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-16">Item {dragData.itemId}:</span>
                <Input
                  placeholder="Item text (optional if image provided)"
                  value={item.text}
                  onChange={(e) => updateOption(fullIndex, "text", e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeOption(fullIndex)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Item Image (İsteğe Bağlı)</Label>
                <ImageUpload
                  value={item.imageSrc || ""}
                  onChange={(url) => updateOption(fullIndex, "imageSrc", url)}
                  placeholder="Sürüklenebilir öğe için resim yükleyin"
                  className="mt-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Drop Zones</h3>
          <Button onClick={addZone} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </div>
        
        {zones.map((zone) => {
          const fullIndex = options.findIndex((opt) => opt === zone);
          const dragData = JSON.parse(zone.dragData!);
          
          return (
            <div key={fullIndex} className="flex items-center space-x-2 p-3 border rounded-lg bg-green-50">
              <span className="text-sm font-medium w-20">Zone {dragData.zoneId}:</span>
              <Input
                placeholder="Zone label"
                value={zone.text}
                onChange={(e) => updateOption(fullIndex, "text", e.target.value)}
                className="flex-1"
              />
              <Select
                value={dragData.correctItemId?.toString()}
                onValueChange={(value) => {
                  const newDragData = { ...dragData, correctItemId: parseInt(value) };
                  updateOption(fullIndex, "dragData", JSON.stringify(newDragData));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => {
                    const itemData = JSON.parse(item.dragData!);
                    return (
                      <SelectItem key={itemData.itemId} value={itemData.itemId.toString()}>
                        Item {itemData.itemId}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => removeOption(fullIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FillBlankForm({ options, updateOption, removeOption, addOption }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
  setOptions: (options: ChallengeOption[]) => void;
}) {
  const blankOptions = options.filter((opt) => opt.isBlank);
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Talimatlar</h3>
        <p className="text-sm text-gray-700">
          Soruda boşlukları işaretlemek için &quot;{"{1}"}&quot;, &quot;{"{2}"}&quot;, vb. kullanın. 
          Ardından aşağıya doğru cevapları girin.
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Boşluk Cevapları</h3>
        <Button onClick={addOption} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Blank
        </Button>
      </div>
      
      {blankOptions.map((option, index) => {
        const fullIndex = options.findIndex((opt) => opt === option);
        
        return (
          <div key={fullIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
            <span className="text-sm font-medium w-16">Boşluk {index + 1}:</span>
            <Input
              placeholder="Bu boşluk için doğru cevap"
              value={option.text}
              onChange={(e) => updateOption(fullIndex, "text", e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={() => removeOption(fullIndex)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function MatchPairsForm({ options, updateOption, setOptions }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  setOptions: (options: ChallengeOption[]) => void;
}) {
  const pairOptions = options.filter((opt) => opt.pairId);
  const pairs = Array.from(new Set(pairOptions.map((opt) => opt.pairId))).sort((a, b) => (a || 0) - (b || 0));
  
  const addPair = () => {
    const maxPairId = Math.max(...pairs.map(p => p || 0), 0);
    const newPairId = maxPairId + 1;
    
    setOptions([
      ...options,
      { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: newPairId },
      { text: "", correct: false, imageSrc: "", audioSrc: "", pairId: newPairId }
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Match Pairs</h3>
        <Button onClick={addPair} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Pair
        </Button>
      </div>
      
      {pairs.map((pairId) => {
        const pairItems = pairOptions.filter((opt) => opt.pairId === pairId);
        
        return (
          <div key={pairId} className="p-4 border rounded-lg bg-purple-50">
            <h4 className="font-medium mb-3">Pair {pairId}</h4>
            <div className="grid grid-cols-2 gap-3">
              {pairItems.map((item, itemIndex) => {
                const fullIndex = options.findIndex((opt) => opt === item);
                
                return (
                  <div key={fullIndex} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder={`Item ${itemIndex + 1} (text optional if image provided)`}
                        value={item.text}
                        onChange={(e) => updateOption(fullIndex, "text", e.target.value)}
                        className="flex-1"
                      />
                      {itemIndex === 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            // Remove both items in the pair
                            const indicesToRemove = pairItems.map((item) => 
                              options.findIndex((opt) => opt === item)
                            ).sort((a, b) => b - a);
                            
                            const newOptions = [...options];
                            indicesToRemove.forEach((index) => {
                              newOptions.splice(index, 1);
                            });
                            setOptions(newOptions);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Item Image (İsteğe Bağlı)</Label>
                      <ImageUpload
                        value={item.imageSrc || ""}
                        onChange={(url) => updateOption(fullIndex, "imageSrc", url)}
                        placeholder="Eşleştirme öğesi için resim yükleyin"
                        className="mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SequenceForm({ options, updateOption, removeOption, addOption }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
  setOptions: (options: ChallengeOption[]) => void;
}) {
  const sequenceOptions = options.filter((opt) => opt.correctOrder).sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sıralama Öğeleri</h3>
        <Button onClick={addOption} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>
      
      {sequenceOptions.map((option) => {
        const fullIndex = options.findIndex((opt) => opt === option);
        
        return (
          <div key={fullIndex} className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium w-16">Adım {option.correctOrder}:</span>
              <Input
                placeholder="Item description (optional if image provided)"
                value={option.text}
                onChange={(e) => updateOption(fullIndex, "text", e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeOption(fullIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Sequence Item Image (İsteğe Bağlı)</Label>
              <ImageUpload
                value={option.imageSrc || ""}
                onChange={(url) => updateOption(fullIndex, "imageSrc", url)}
                placeholder="Sıralama öğesi için resim yükleyin"
                className="mt-1"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimerChallengeForm({ options, updateOption, removeOption, addOption, setOptions, formId }: {
  options: ChallengeOption[];
  updateOption: (index: number, field: string, value: unknown) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
  setOptions: (options: ChallengeOption[]) => void;
  formId?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Zamanlı Çoktan Seçmeli</h3>
        <p className="text-sm text-gray-700">
          Bu zorluk türü için önceden ayarladığınız süre limiti olacaktır. Seçenekleri çoktan seçmeli soru gibi oluşturun.
        </p>
      </div>
      
      <SelectAssistForm 
        options={options} 
        updateOption={updateOption} 
        removeOption={removeOption} 
        addOption={addOption} 
        setOptions={setOptions}
        formId={formId}
      />
    </div>
  );
} 