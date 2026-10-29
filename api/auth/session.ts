export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, authenticated: false }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    success: true,
    authenticated: true,
    timestamp: new Date().toISOString()
  }));
}
