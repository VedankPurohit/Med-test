import type { ExamCardFolder } from '@/features/workstation/types/workstation';
import type { CaseId } from '@/features/workstation/types/mri';
import { filterPlannableExamCards } from './protocolRegistry';

const EXAM_CARDS: ExamCardFolder[] = [
  {
    id: 'brain',
    label: 'BRAIN',
    children: [
      { id: 'axial-t2-tse', label: 'Ax T2 TSE', shortName: 'Ax T2', orientation: 'TRA', region: 'brain', estimatedTime: '2:30' },
      { id: 'axial-t2-flair', label: 'Ax T2 FLAIR', shortName: 'Ax FLAIR', orientation: 'TRA', region: 'brain', estimatedTime: '3:10' },
      { id: 'sagittal-t1-tse', label: 'Sag T1 TSE', shortName: 'Sag T1', orientation: 'SAG', region: 'brain', estimatedTime: '2:45' },
      { id: 'axial-dwi', label: 'Ax DWI', shortName: 'Ax DWI', orientation: 'TRA', region: 'brain', estimatedTime: '1:30' },
    ],
  },
  {
    id: 'sella',
    label: 'SELLA + C',
    children: [
      { id: 'sella-cor-t2', label: 'Cor T2 TSE (Sella)', shortName: 'Cor T2', orientation: 'COR', region: 'brain', estimatedTime: '3:00' },
      { id: 'sella-cor-t1', label: 'Cor T1 TSE (Sella)', shortName: 'Cor T1', orientation: 'COR', region: 'brain', estimatedTime: '2:30' },
      { id: 'sella-sag-t1', label: 'Sag T1 TSE (Sella)', shortName: 'Sag T1', orientation: 'SAG', region: 'brain', estimatedTime: '2:45' },
    ],
  },
  {
    id: 'dorsal-spine',
    label: 'DORSAL SPINE',
    children: [
      { id: 'spine-sagittal-t2-tse', label: 'Sag T2 TSE', shortName: 'Sag T2', orientation: 'SAG', region: 'spine', estimatedTime: '3:00' },
      { id: 'spine-sagittal-t1-tse', label: 'Sag T1 TSE', shortName: 'Sag T1', orientation: 'SAG', region: 'spine', estimatedTime: '2:45' },
      { id: 'spine-sagittal-stir', label: 'Sag STIR', shortName: 'Sag STIR', orientation: 'SAG', region: 'spine', estimatedTime: '3:30' },
      { id: 'spine-coronal-stir', label: 'Cor STIR', shortName: 'Cor STIR', orientation: 'COR', region: 'spine', estimatedTime: '3:20' },
      { id: 'spine-axial-t2-tse', label: 'Ax T2 TSE', shortName: 'Ax T2', orientation: 'TRA', region: 'spine', estimatedTime: '2:30' },
      { id: 'spine-axial-t1-tse', label: 'Ax T1 TSE', shortName: 'Ax T1', orientation: 'TRA', region: 'spine', estimatedTime: '2:00' },
    ],
  },
  {
    id: 'neck',
    label: 'NECK',
    children: [
      { id: 'neck-ax-t2', label: 'Ax T2 TSE (Neck)', shortName: 'Ax T2', orientation: 'TRA', region: 'spine', estimatedTime: '2:30' },
      { id: 'neck-cor-stir', label: 'Cor STIR (Neck)', shortName: 'Cor STIR', orientation: 'COR', region: 'spine', estimatedTime: '3:15' },
      { id: 'neck-sag-t2', label: 'Sag T2 TSE (Neck)', shortName: 'Sag T2', orientation: 'SAG', region: 'spine', estimatedTime: '2:50' },
    ],
  },
];

export function getExamCards(): ExamCardFolder[] {
  return EXAM_CARDS;
}

/** Returns ExamCard entries filtered to only those with planner definitions,
 *  optionally further filtered by case (sub-region). */
export function getPlannableExamCards(caseId?: CaseId | null): ExamCardFolder[] {
  return filterPlannableExamCards(EXAM_CARDS, caseId);
}
