export const getWelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo ao Stratis Planner</title>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-w-lg mx-auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
    .content { color: #334155; line-height: 1.6; font-size: 16px; }
    .btn { display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; font-size: 14px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container" style="max-width: 600px; margin: 40px auto;">
    <div class="header">
      <div class="logo">Stratis Planner</div>
    </div>
    <div class="content">
      <h2>Olá, ${name}! 👋</h2>
      <p>Estamos muito felizes em ter você conosco no Stratis Planner.</p>
      <p>Nossa plataforma foi criada para ajudar você a planejar, organizar e alcançar seus objetivos de forma inteligente.</p>
      <div style="text-align: center;">
        <a href="https://app.stratisplanner.com/dashboard" class="btn" style="color: white;">Acessar meu Dashboard</a>
      </div>
      <p style="margin-top: 30px;">Se precisar de ajuda, basta responder a este email.</p>
      <p>Abraços,<br>Equipe Stratis Planner</p>
    </div>
    <div class="footer">
      <p>© 2024 Stratis Planner. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordResetEmailTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recuperação de Senha</title>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-w-lg mx-auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .content { color: #334155; line-height: 1.6; font-size: 16px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container" style="max-width: 600px; margin: 40px auto;">
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a redefinição da sua senha no Stratis Planner.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="btn" style="color: white;">Redefinir Senha</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px;">Se você não solicitou essa alteração, pode ignorar este email com segurança.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordUpdatedEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Senha Atualizada</title>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-w-lg mx-auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .content { color: #334155; line-height: 1.6; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container" style="max-width: 600px; margin: 40px auto;">
    <div class="content">
      <h2>Senha Atualizada com Sucesso</h2>
      <p>Olá, ${name}.</p>
      <p>Este é um aviso para confirmar que a sua senha no Stratis Planner acabou de ser alterada.</p>
      <p>Se foi você, não precisa fazer mais nada.</p>
      <p style="color: #ef4444; margin-top: 20px;"><strong>Não foi você?</strong><br>Por favor, redefina sua senha imediatamente contatando nosso suporte.</p>
    </div>
  </div>
</body>
</html>
`;
