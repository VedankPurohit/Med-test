import type { ExamCardFolder } from '@/features/workstation/types/workstation';

const EXAM_CARDS: ExamCardFolder[] = [
  {
    id: 'brain',
    label: 'BRAIN',
    children: [
      { id: 'axial-t2-tse', label: 'Ax T2 TSE', shortName: 'Ax T2', orientation: 'TRA', region: 'brain', estimatedTime: '2:30' },
      { id: 'axial-t2-flair', label: 'Ax T2 FLAIR', shortName: 'Ax FLAIR', orientation: 'TRA', region: 'brain', estimatedTime: '3:10' },
      { id: 'axial-t1-tse', label: 'Ax T1 TSE', shortName: 'Ax T1', orientation: 'TRA', region: 'brain', estimatedTime: '2:00' },
      { id: 'sagittal-t1-tse', label: 'Sag T1 TSE', shortName: 'Sag T1', orientation: 'SAG', region: 'brain', estimatedTime: '2:45' },
      { id: 'coronal-t1-tse', label: 'Cor T1 TSE', shortName: 'Cor T1', orientation: 'COR', region: 'brain', estimatedTime: '2:15' },
      { id: 'axial-dwi', label: 'Ax DWI', shortName: 'Ax DWI', orientation: 'TRA', region: 'brain', estimatedTime: '1:30' },
      { id: 'sagittal-3d-t1-mprage', label: '3D Sag T1 MPRAGE', shortName: '3D MPRAGE', orientation: 'SAG', region: 'brain', estimatedTime: '5:20' },
      { id: 'axial-swi', label: 'Ax SWI', shortName: 'Ax SWI', orientation: 'TRA', region: 'brain', estimatedTime: '4:00' },
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
