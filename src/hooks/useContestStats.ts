import { useMemo } from 'react';
import { Contest, Subject } from '../types';

export function useContestStats(contest: Contest | null) {
  return useMemo(() => {
    if (!contest) {
      return {
        overallProgress: 0,
        totalTopics: 0,
        completedTopics: 0,
        subjectProgress: [],
        totalHours: 0,
        totalQuestions: 0,
        streak: 0,
        last7Days: [],
        generalProgressProps: { total: 0, completed: 0, percent: 0 },
        specificProgressProps: { total: 0, completed: 0, percent: 0 },
        lawProgressProps: { total: 0, completed: 0, percent: 0 },
      };
    }

    // 1. Progress Calculation
    const subs = contest.subjects || [];
    
    const subjectProgress = subs.map(s => {
      const hasTopicsList = s.topics && s.topics.length > 0;
      const total = hasTopicsList ? s.topics!.length : (s.totalTopics || 0);
      const completed = hasTopicsList 
        ? s.topics!.filter(t => t.completed).length 
        : (s.completedTopics || 0);
      
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      return {
        name: s.name,
        total,
        completed,
        percentage: Math.round(percentage)
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const totalTopics = subjectProgress.reduce((acc, s) => acc + s.total, 0);
    const completedTopics = subjectProgress.reduce((acc, s) => acc + s.completed, 0);
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Detailed Categories Progress
    const calculateCategoryProgress = (categorySubs: Subject[]) => {
      const stats = categorySubs.map(s => {
        const hasTopicsList = s.topics && s.topics.length > 0;
        const total = hasTopicsList ? s.topics!.length : (s.totalTopics || 0);
        const completed = hasTopicsList 
          ? s.topics!.filter(t => t.completed).length 
          : (s.completedTopics || 0);
        return { total, completed };
      });

      const catTotal = stats.reduce((acc, s) => acc + s.total, 0);
      const catCompleted = stats.reduce((acc, s) => acc + s.completed, 0);
      return { total: catTotal, completed: catCompleted, percent: catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0 };
    };

    const isSpecific = (s: Subject) => {
      const cat = (s.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const name = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fullText = cat + ' ' + name;
      if (fullText.includes('especific')) return true;
      const terms = [
        'tecnico', 'foco', 'modulo 2', 'modulo ii', 
        'parte 2', 'parte ii', 'conhecimentos e', 'especializad', 'profission', 'mod 2',
        'eixo tematico 2', 'eixo 2'
      ];
      return terms.some(term => fullText.includes(term));
    };

    const isLaw = (s: Subject) => {
      const cat = (s.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const name = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fullText = cat + ' ' + name;
      const lawTerms = ['direito', 'lei', 'legislaca', 'juridico', 'normas', 'constit']
      return lawTerms.some(term => fullText.includes(term));
    };

    const specificProgressProps = calculateCategoryProgress(subs.filter(s => isSpecific(s)));
    const lawProgressProps = calculateCategoryProgress(subs.filter(s => isLaw(s)));
    
    // Everything else or explicitly marked as general
    const generalProgressProps = calculateCategoryProgress(subs.filter(s => {
       const cat = (s.category || '').toLowerCase();
       if (cat.includes('geral') || cat.includes('base') || cat.includes('basi') || cat.includes('comun')) return true;
       return !isSpecific(s) && !isLaw(s);
    }));

    // 2. History & Daily Stats
    const historyData = [...(contest.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const totalHours = Number(historyData.reduce((acc, h) => acc + (h.hours || 0), 0).toFixed(2));
    const totalQuestions = historyData.reduce((acc, h) => acc + (h.questions || 0), 0);

    // Calculate Last 7 Days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const localDate = new Date(d);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      const dateStr = localDate.toISOString().split('T')[0];
      
      const entry = historyData.find(h => h.date === dateStr);
      last7Days.push({
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        date: dateStr,
        horas: entry ? Number(entry.hours.toFixed(2)) : 0,
        questoes: entry ? entry.questions : 0
      });
    }

    // Calculate Streak
    let streak = 0;
    const dObj = new Date();
    while (true) {
      const year = dObj.getFullYear();
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const day = String(dObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (historyData.some(h => h.date === dateStr && (h.hours > 0 || h.questions > 0))) {
        streak++;
        dObj.setDate(dObj.getDate() - 1);
      } else {
        const todayDObj = new Date();
        const tYear = todayDObj.getFullYear();
        const tMonth = String(todayDObj.getMonth() + 1).padStart(2, '0');
        const tDay = String(todayDObj.getDate()).padStart(2, '0');
        const todayStr = `${tYear}-${tMonth}-${tDay}`;

        if (streak === 0 && dateStr === todayStr) {
           dObj.setDate(dObj.getDate() - 1);
           continue;
        }
        break;
      }
    }

    // Today Task Calculation
    const getStartDate = () => {
      if (contest.scheduleStartDate) return new Date(contest.scheduleStartDate + 'T00:00:00');
      if ((contest as any).createdAt && (contest as any).createdAt.toDate) {
        return (contest as any).createdAt.toDate();
      }
      const timestampStr = contest.id.split('-')[1];
      if (timestampStr && !isNaN(parseInt(timestampStr, 10))) {
        return new Date(parseInt(timestampStr, 10));
      }
      return new Date();
    };

    const startDate = getStartDate();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const todayDayNumber = Math.max(1, diffDays + 1);

    const todayTaskIncomplete = contest?.schedule?.find(day => !day.completed);
    const todayTask = contest?.schedule?.find(day => day.dayNumber === todayDayNumber) || todayTaskIncomplete;

    // Today History
    const localNow = new Date();
    localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
    const todayStrFull = localNow.toISOString().split('T')[0];
    const todayHistory = historyData.find(h => h.date === todayStrFull);

    // MEPP Active Review Stats
    const meppReviews = contest.meppReviews || [];
    const totalMeppReviews = meppReviews.length;
    const completedMeppReviews = meppReviews.filter(r => r.reviewType === 'completed').length;
    const pendingMeppReviews = meppReviews.filter(r => r.dueDate <= todayStrFull && r.reviewType !== 'completed').length;
    const scheduledMeppReviews = meppReviews.filter(r => r.dueDate > todayStrFull && r.reviewType !== 'completed').length;
    
    const reviews24h = meppReviews.filter(r => r.reviewType === '24h').length;
    const reviews7d = meppReviews.filter(r => r.reviewType === '7d').length;
    const reviews30d = meppReviews.filter(r => r.reviewType === '30d').length;

    const meppComplianceRate = totalMeppReviews > 0 
      ? Math.round((completedMeppReviews / totalMeppReviews) * 100) 
      : 0;

    return {
      overallProgress,
      totalTopics,
      completedTopics,
      subjectProgress,
      totalHours,
      totalQuestions,
      streak,
      last7Days,
      generalProgressProps,
      specificProgressProps,
      lawProgressProps,
      todayDayNumber,
      todayTask,
      todayHistory,
      meppReviews,
      totalMeppReviews,
      completedMeppReviews,
      pendingMeppReviews,
      scheduledMeppReviews,
      reviews24h,
      reviews7d,
      reviews30d,
      meppComplianceRate
    };
  }, [contest]);
}
