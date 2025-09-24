import express, { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';
import { hashPassword, generateSecureToken, hashToken } from '../utils/auth';

const router = express.Router();

// Password comparison demonstration
router.post('/password-comparison', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: { message: 'Password is required for comparison' },
      });
    }

    const startTime = process.hrtime.bigint();

    // Demonstrate different storage methods
    const demonstrations = {
      plaintext: {
        stored: password,
        method: 'Plaintext Storage (NEVER USE)',
        security_level: 'INSECURE',
        time_ms: 0,
        explanation: 'Password stored as-is. Anyone with database access can see all passwords.',
      },
      md5: {
        stored: createHash('md5').update(password).digest('hex'),
        method: 'MD5 Hash (DEPRECATED)',
        security_level: 'VERY_WEAK',
        time_ms: 0,
        explanation: 'Fast hash function, vulnerable to rainbow table attacks and brute force.',
      },
      sha256: {
        stored: createHash('sha256').update(password).digest('hex'),
        method: 'SHA-256 (INSUFFICIENT)',
        security_level: 'WEAK',
        time_ms: 0,
        explanation: 'Better than MD5 but still too fast. Vulnerable to rainbow tables without salt.',
      },
      sha256_salted: {
        stored: '',
        method: 'SHA-256 with Salt (BETTER)',
        security_level: 'MODERATE',
        time_ms: 0,
        explanation: 'Adding salt prevents rainbow table attacks but still too fast for brute force.',
      },
      argon2id: {
        stored: '',
        method: 'Argon2id (RECOMMENDED)',
        security_level: 'STRONG',
        time_ms: 0,
        explanation: 'Memory-hard function resistant to both time-memory trade-offs and side-channel attacks.',
      },
    };

    // Generate salt for salted SHA-256
    const salt = randomBytes(32).toString('hex');
    const sha256Start = process.hrtime.bigint();
    demonstrations.sha256_salted.stored = createHash('sha256').update(password + salt).digest('hex');
    const sha256End = process.hrtime.bigint();
    demonstrations.sha256_salted.time_ms = Number(sha256End - sha256Start) / 1000000;

    // Argon2id timing
    const argon2Start = process.hrtime.bigint();
    const { hash } = await hashPassword(password);
    const argon2End = process.hrtime.bigint();
    demonstrations.argon2id.stored = hash;
    demonstrations.argon2id.time_ms = Number(argon2End - argon2Start) / 1000000;

    const totalTime = process.hrtime.bigint();
    const processingTime = Number(totalTime - startTime) / 1000000;

    res.json({
      input_password: password,
      demonstrations,
      timing_analysis: {
        total_processing_time_ms: processingTime,
        argon2id_vs_sha256_ratio: demonstrations.argon2id.time_ms / demonstrations.sha256_salted.time_ms,
        recommendation: 'Argon2id takes longer to compute, making brute force attacks impractical.',
      },
      security_insights: {
        entropy_analysis: {
          password_length: password.length,
          character_set_size: getCharacterSetSize(password),
          estimated_entropy_bits: Math.log2(Math.pow(getCharacterSetSize(password), password.length)),
        },
        attack_scenarios: [
          'Rainbow table attacks are prevented by proper salting',
          'Brute force attacks are slowed by memory-hard functions like Argon2id',
          'Dictionary attacks can be mitigated by password complexity requirements',
        ],
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Token analysis demonstration
router.post('/token-analysis', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count = 5 } = req.body;

    const tokenAnalysis: any = {
      secure_tokens: [],
      insecure_tokens: [],
      entropy_comparison: {},
      timing_analysis: {},
    };

    // Generate secure tokens (Copenhagen Book standard)
    const secureStart = process.hrtime.bigint();
    for (let i = 0; i < count; i++) {
      const token = generateSecureToken();
      tokenAnalysis.secure_tokens.push({
        token,
        length: token.length,
        encoding: 'base32',
        entropy_bits: 15 * 8, // 15 bytes = 120 bits
        method: 'crypto.randomBytes(15)',
      });
    }
    const secureEnd = process.hrtime.bigint();

    // Generate insecure tokens (for comparison)
    const insecureStart = process.hrtime.bigint();
    for (let i = 0; i < count; i++) {
      const insecureToken = Math.random().toString(36).substring(2, 15);
      tokenAnalysis.insecure_tokens.push({
        token: insecureToken,
        length: insecureToken.length,
        encoding: 'base36',
        entropy_bits: Math.log2(Math.pow(36, insecureToken.length)),
        method: 'Math.random() (INSECURE)',
      });
    }
    const insecureEnd = process.hrtime.bigint();

    tokenAnalysis.entropy_comparison = {
      secure_entropy_bits: 120,
      insecure_entropy_bits: Math.log2(Math.pow(36, 13)),
      security_difference: '2^120 vs 2^67 possible values',
      recommendation: 'Use crypto.randomBytes() for cryptographically secure randomness',
    };

    tokenAnalysis.timing_analysis = {
      secure_generation_time_ms: Number(secureEnd - secureStart) / 1000000,
      insecure_generation_time_ms: Number(insecureEnd - insecureStart) / 1000000,
      note: 'Secure generation is slightly slower but provides much better security',
    };

    res.json({
      analysis: tokenAnalysis,
      security_insights: {
        token_storage: 'Hash tokens with SHA-256 before storing in database',
        expiration: 'Always set appropriate expiration times',
        single_use: 'Mark tokens as used after consumption',
        entropy_requirement: 'Minimum 112 bits of entropy (Copenhagen Book standard)',
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Session lifecycle demonstration
router.post('/session-demo', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { demo_type = 'lifecycle' } = req.body;

    const sessionDemo: any = {
      session_creation: {
        session_id: generateSecureToken(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        storage_methods: {
          memory: {
            pros: ['Fast access', 'No database overhead'],
            cons: ['Lost on server restart', 'Not scalable across instances'],
            use_case: 'Development or single-server applications',
          },
          mongodb: {
            pros: ['Persistent', 'Scalable', 'TTL index for automatic cleanup'],
            cons: ['Database dependency', 'Slightly slower'],
            use_case: 'Production applications',
          },
          redis: {
            pros: ['Very fast', 'Persistent', 'Built-in expiration'],
            cons: ['Additional service dependency'],
            use_case: 'High-performance applications',
          },
        },
      },
      security_attributes: {
        httpOnly: {
          value: true,
          purpose: 'Prevents JavaScript access to session cookies',
          attack_prevention: 'XSS attacks cannot steal session cookies',
        },
        secure: {
          value: 'production only',
          purpose: 'Only send cookies over HTTPS',
          attack_prevention: 'Prevents session hijacking over insecure connections',
        },
        sameSite: {
          value: 'Lax',
          purpose: 'Controls cross-site request behavior',
          attack_prevention: 'Mitigates CSRF attacks',
          options: {
            Strict: 'Maximum protection, may break some legitimate flows',
            Lax: 'Good balance of security and usability',
            None: 'Least secure, allows all cross-site requests',
          },
        },
      },
      session_management: {
        fixation_prevention: 'Generate new session ID on authentication',
        expiration_handling: 'Automatic cleanup via TTL indexes',
        invalidation_triggers: [
          'User logout',
          'Password change',
          'Privilege escalation',
          'Suspicious activity',
        ],
      },
    };

    if (demo_type === 'attack_simulation') {
      sessionDemo.attack_scenarios = {
        session_fixation: {
          description: 'Attacker sets session ID before user logs in',
          prevention: 'Always generate new session ID on authentication',
          demo_safe: true,
        },
        session_hijacking: {
          description: 'Attacker steals session cookie',
          prevention: 'Use HTTPS, HttpOnly, and monitor for suspicious activity',
          demo_safe: true,
        },
        csrf: {
          description: 'Cross-site request forgery using session',
          prevention: 'SameSite cookies and CSRF tokens',
          demo_safe: true,
        },
      };
    }

    res.json({
      demo_type,
      session_demonstration: sessionDemo,
      educational_notes: [
        'Sessions bridge the gap between stateless HTTP and stateful applications',
        'Proper session management is crucial for application security',
        'Always consider the trade-offs between performance and security',
        'Monitor session usage patterns to detect anomalies',
      ],
    });
  } catch (error) {
    return next(error);
  }
});

// Security attack simulation (safe environment)
router.post('/attack-simulation', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attack_type } = req.body;

    const simulations: any = {
      timing_attack: simulateTimingAttack(),
      csrf_demo: simulateCsrfDemo(),
      password_spraying: simulatePasswordSpraying(),
    };

    if (attack_type && simulations[attack_type]) {
      res.json({
        attack_type,
        simulation: simulations[attack_type],
        educational_purpose: 'This simulation demonstrates the attack in a safe environment',
      });
    } else {
      res.json({
        available_simulations: Object.keys(simulations),
        simulations,
        disclaimer: 'All simulations are for educational purposes in a controlled environment',
      });
    }
  } catch (error) {
    return next(error);
  }
});

// Helper functions
function getCharacterSetSize(password: string): number {
  let charSetSize = 0;
  if (/[a-z]/.test(password)) charSetSize += 26;
  if (/[A-Z]/.test(password)) charSetSize += 26;
  if (/[0-9]/.test(password)) charSetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSetSize += 32; // Approximate special chars
  return charSetSize;
}

function simulateTimingAttack() {
  const correctPassword = 'secretpassword123';
  const attempts = ['wrong', 'secretp', 'secretpassword123'];

  return {
    description: 'Timing attacks exploit differences in processing time',
    demonstration: attempts.map(attempt => {
      const start = process.hrtime.bigint();
      // Simulate vulnerable comparison (character by character)
      let matches = 0;
      for (let i = 0; i < Math.min(attempt.length, correctPassword.length); i++) {
        if (attempt[i] === correctPassword[i]) {
          matches++;
        } else {
          break;
        }
      }
      const end = process.hrtime.bigint();

      return {
        attempt,
        processing_time_ns: Number(end - start),
        characters_matched: matches,
        is_correct: attempt === correctPassword,
      };
    }),
    prevention: 'Use constant-time comparison functions like timingSafeEqual',
    real_world_impact: 'Attackers can infer password characters based on response times',
  };
}

function simulateCsrfDemo() {
  return {
    description: 'Cross-Site Request Forgery exploits automatic cookie inclusion',
    vulnerable_request: {
      method: 'POST',
      url: '/api/auth/change-password',
      cookies: 'session=abc123; Path=/; HttpOnly',
      origin: 'https://malicious-site.com',
      referer: 'https://malicious-site.com/evil-page',
    },
    attack_vector: {
      malicious_html: '<form action="https://bloom-app.com/api/auth/change-password" method="POST"><input name="new_password" value="hacked123"><script>document.forms[0].submit()</script></form>',
      description: 'Malicious site tricks user into making authenticated request',
    },
    prevention_methods: {
      csrf_tokens: 'Include unpredictable token in forms',
      samesite_cookies: 'Set SameSite=Lax or Strict on session cookies',
      origin_validation: 'Check Origin and Referer headers',
      custom_headers: 'Require custom headers that trigger CORS preflight',
    },
    bloom_implementation: 'Uses SameSite=Lax cookies and validates request origin',
  };
}

function simulatePasswordSpraying() {
  const commonPasswords = ['password123', 'admin123', 'welcome1', 'Password1'];
  const accounts = ['admin@test.com', 'user@test.com', 'test@test.com'];

  return {
    description: 'Password spraying tries common passwords against many accounts',
    attack_pattern: accounts.map(email => ({
      target_email: email,
      attempted_passwords: commonPasswords,
      detection_evasion: 'Low frequency to avoid rate limiting',
    })),
    prevention_methods: {
      rate_limiting: 'Limit authentication attempts per IP and per account',
      account_lockout: 'Temporarily lock accounts after failed attempts',
      password_policy: 'Enforce strong password requirements',
      monitoring: 'Detect unusual authentication patterns',
      captcha: 'Add CAPTCHA after multiple failures',
    },
    bloom_protection: {
      ip_rate_limiting: '5 attempts per 15 minutes per IP',
      account_lockout: '5 attempts locks account for 2 hours',
      password_strength: 'Enforced complexity requirements',
    },
  };
}

export default router;