import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity, 
  Heart, 
  Footprints,
  MapPin,
  Calendar,
  Timer,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

const ActivityValidator = ({ challenge, onValidationComplete }) => {
  const [userActivities, setUserActivities] = useState([]);
  const [validatingActivity, setValidatingActivity] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserActivities();
  }, [challenge]);

  const loadUserActivities = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/devices/activities/user_001`);
      const data = await response.json();
      if (data.success) {
        // Filtrar atividades relevantes para o desafio
        const relevantActivities = data.activities.filter(activity => 
          isActivityRelevantForChallenge(activity, challenge)
        );
        setUserActivities(relevantActivities);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const isActivityRelevantForChallenge = (activity, challenge) => {
    const challengeType = challenge.category?.toLowerCase();
    const activityType = activity.type?.toLowerCase();

    const typeMapping = {
      'corrida': ['running', 'run'],
      'ciclismo': ['cycling', 'bike', 'bicycle'],
      'natação': ['swimming', 'swim'],
      'passos': ['steps', 'walking', 'walk'],
      'treinos': ['workout', 'training', 'hiit', 'gym'],
      'calorias': ['calories', 'workout', 'running', 'cycling']
    };

    const validTypes = typeMapping[challengeType] || [challengeType];
    return validTypes.some(type => activityType.includes(type));
  };

  const validateActivity = async (activity) => {
    setValidatingActivity(activity.id);
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/devices/validate-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user_001',
          activity_id: activity.id,
          challenge_id: challenge.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setValidationResults(prev => ({
          ...prev,
          [activity.id]: data.validation
        }));

        if (onValidationComplete) {
          onValidationComplete(activity, data.validation);
        }
      }
    } catch (error) {
      console.error('Erro ao validar atividade:', error);
    } finally {
      setValidatingActivity(null);
      setLoading(false);
    }
  };

  const getChallengeRequirements = (challenge) => {
    const requirements = [];
    
    if (challenge.title?.includes('5km')) {
      requirements.push({ type: 'distance', value: 5, unit: 'km' });
    } else if (challenge.title?.includes('10km')) {
      requirements.push({ type: 'distance', value: 10, unit: 'km' });
    } else if (challenge.title?.includes('20km')) {
      requirements.push({ type: 'distance', value: 20, unit: 'km' });
    }

    if (challenge.title?.includes('30min')) {
      requirements.push({ type: 'duration', value: 30, unit: 'min' });
    } else if (challenge.title?.includes('60min')) {
      requirements.push({ type: 'duration', value: 60, unit: 'min' });
    }

    if (challenge.title?.includes('10k Steps')) {
      requirements.push({ type: 'steps', value: 10000, unit: 'passos' });
    }

    if (challenge.title?.includes('500 cal')) {
      requirements.push({ type: 'calories', value: 500, unit: 'cal' });
    }

    return requirements;
  };

  const checkActivityMeetsRequirements = (activity, requirements) => {
    const results = {};
    
    requirements.forEach(req => {
      switch (req.type) {
        case 'distance':
          results.distance = activity.distance >= req.value;
          break;
        case 'duration':
          results.duration = (activity.duration / 60) >= req.value;
          break;
        case 'steps':
          results.steps = activity.steps >= req.value;
          break;
        case 'calories':
          results.calories = activity.calories >= req.value;
          break;
      }
    });

    return results;
  };

  const formatActivityValue = (activity, type) => {
    switch (type) {
      case 'distance':
        return `${activity.distance?.toFixed(1) || 0} km`;
      case 'duration':
        return `${Math.floor((activity.duration || 0) / 60)} min`;
      case 'steps':
        return `${activity.steps?.toLocaleString() || 0} passos`;
      case 'calories':
        return `${activity.calories || 0} cal`;
      default:
        return 'N/A';
    }
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      running: Activity,
      cycling: Activity,
      swimming: Activity,
      steps: Footprints,
      workout: Zap,
      calories: Heart
    };
    return icons[activityType] || Activity;
  };

  const requirements = getChallengeRequirements(challenge);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Validação de Atividades</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Suas atividades sincronizadas que podem ser validadas para este desafio
        </p>

        {/* Requisitos do Desafio */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary" />
            Requisitos do Desafio
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {requirements.map((req, index) => (
              <div key={index} className="text-center p-2 bg-background rounded-lg">
                <div className="text-sm font-medium text-foreground">
                  {req.value} {req.unit}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {req.type === 'duration' ? 'Duração' : 
                   req.type === 'distance' ? 'Distância' :
                   req.type === 'steps' ? 'Passos' :
                   req.type === 'calories' ? 'Calorias' : req.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div>
        {userActivities.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma atividade relevante encontrada. Sincronize seus dispositivos para ver atividades disponíveis.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {userActivities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const validation = validationResults[activity.id];
              const meetsRequirements = checkActivityMeetsRequirements(activity, requirements);
              const isValidating = validatingActivity === activity.id;

              return (
                <div key={activity.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <ActivityIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{activity.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(activity.start_time).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span className="capitalize">{activity.device_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {validation ? (
                      <div className="flex items-center space-x-2">
                        {validation.valid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          Score: {validation.score}%
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => validateActivity(activity)}
                        disabled={isValidating}
                        size="sm"
                      >
                        {isValidating ? (
                          <>
                            <Clock className="w-4 h-4 mr-1 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Validar
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Métricas da Atividade */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {requirements.map((req, index) => {
                      const activityValue = formatActivityValue(activity, req.type);
                      const meets = meetsRequirements[req.type];
                      
                      return (
                        <div key={index} className="text-center p-2 bg-background rounded-lg">
                          <div className={`text-sm font-medium ${meets ? 'text-green-600' : 'text-red-600'}`}>
                            {activityValue}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {req.type === 'duration' ? 'Duração' : 
                             req.type === 'distance' ? 'Distância' :
                             req.type === 'steps' ? 'Passos' :
                             req.type === 'calories' ? 'Calorias' : req.type}
                          </div>
                          {meets ? (
                            <CheckCircle className="w-3 h-3 text-green-500 mx-auto mt-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-500 mx-auto mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resultado da Validação */}
                  {validation && (
                    <div className={`p-3 rounded-lg ${validation.valid ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {validation.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${validation.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                          {validation.message}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(validation.criteria_met).map(([criteria, met]) => (
                          <div key={criteria} className="flex items-center space-x-1">
                            {met ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-600" />
                            )}
                            <span className="capitalize">{criteria.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityValidator;

