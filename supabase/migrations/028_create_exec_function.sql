-- Função para executar SQL dinamico (necessita de service role)
CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
