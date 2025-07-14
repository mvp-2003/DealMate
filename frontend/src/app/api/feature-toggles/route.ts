import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const defaultToggles = {
  Login: true,
};

export async function GET() {
  try {
    const togglesPath = path.join(process.cwd(), '../feature-toggles.json');
    console.log('Looking for toggles at:', togglesPath);
    console.log('File exists:', fs.existsSync(togglesPath));
    
    if (fs.existsSync(togglesPath)) {
      const togglesData = fs.readFileSync(togglesPath, 'utf8');
      const toggles = { ...defaultToggles, ...JSON.parse(togglesData) };
      console.log('Loaded toggles:', toggles);
      return NextResponse.json(toggles);
    }
  } catch (error) {
    console.warn('Failed to read feature toggles, using defaults:', error);
  }
  
  console.log('Using default toggles:', defaultToggles);
  return NextResponse.json(defaultToggles);
}