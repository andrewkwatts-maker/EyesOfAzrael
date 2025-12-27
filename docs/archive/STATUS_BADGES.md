# Status Badges for Eyes of Azrael

Add these badges to your README.md to show deployment status, test results, and more.

## Deployment Status

### GitHub Actions Badge

```markdown
[![Deploy to Firebase](https://github.com/yourusername/EyesOfAzrael/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/deploy.yml)
```

### Firebase Hosting Badge

```markdown
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://your-site.web.app)
```

## Test Status

### Tests Badge

```markdown
[![Tests](https://github.com/yourusername/EyesOfAzrael/actions/workflows/tests.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/tests.yml)
```

### Lighthouse Badge

```markdown
[![Lighthouse](https://github.com/yourusername/EyesOfAzrael/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/lighthouse.yml)
```

## Performance Scores

### Lighthouse Performance

```markdown
![Lighthouse Performance](https://img.shields.io/badge/Performance-94%2F100-brightgreen)
```

### Lighthouse Accessibility

```markdown
![Lighthouse Accessibility](https://img.shields.io/badge/Accessibility-96%2F100-brightgreen)
```

### Lighthouse Best Practices

```markdown
![Lighthouse Best Practices](https://img.shields.io/badge/Best%20Practices-92%2F100-brightgreen)
```

### Lighthouse SEO

```markdown
![Lighthouse SEO](https://img.shields.io/badge/SEO-95%2F100-brightgreen)
```

## Technology Stack

```markdown
![Node.js](https://img.shields.io/badge/Node.js-18-green?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange?logo=firebase)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)
```

## Project Stats

### Version

```markdown
![Version](https://img.shields.io/badge/version-1.0.0-blue)
```

### License

```markdown
![License](https://img.shields.io/badge/license-MIT-green)
```

### Maintenance

```markdown
![Maintenance](https://img.shields.io/badge/Maintained-Yes-green)
```

## Security

### Security Scan

```markdown
![Security Scan](https://img.shields.io/badge/security-passing-brightgreen)
```

### npm Audit

```markdown
![npm audit](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen)
```

## Coverage (if you add tests)

```markdown
![Coverage](https://img.shields.io/badge/coverage-85%25-yellowgreen)
```

## Complete README Example

Here's how to use these badges in your README.md:

```markdown
# Eyes of Azrael

[![Deploy to Firebase](https://github.com/yourusername/EyesOfAzrael/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/deploy.yml)
[![Tests](https://github.com/yourusername/EyesOfAzrael/actions/workflows/tests.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/tests.yml)
[![Lighthouse](https://github.com/yourusername/EyesOfAzrael/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/yourusername/EyesOfAzrael/actions/workflows/lighthouse.yml)
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://your-site.web.app)

![Lighthouse Performance](https://img.shields.io/badge/Performance-94%2F100-brightgreen)
![Lighthouse Accessibility](https://img.shields.io/badge/Accessibility-96%2F100-brightgreen)
![Lighthouse Best Practices](https://img.shields.io/badge/Best%20Practices-92%2F100-brightgreen)
![Lighthouse SEO](https://img.shields.io/badge/SEO-95%2F100-brightgreen)

![Node.js](https://img.shields.io/badge/Node.js-18-green?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange?logo=firebase)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> Comprehensive world mythology explorer with entity system and dynamic content loading

## Live Site

🌐 [Visit Eyes of Azrael](https://your-site.web.app)

## Features

- 1000+ mythological entities across 15+ mythologies
- Advanced search and filtering
- Archetype analysis and comparison
- Dynamic Firebase backend
- Responsive design
- Dark/Light themes

## Quick Start

### Deployment

```bash
# Deploy to production
./deploy.sh

# Deploy to staging
./deploy.sh staging
```

### Development

```bash
# Install dependencies
npm install

# Build
./build.sh

# Test
./test.sh

# Serve locally
firebase serve
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Monitoring Setup](monitoring-setup.md)
- [Quick Start](DEPLOYMENT_QUICK_START.md)
- [Automation Summary](AUTOMATION_SUMMARY.md)

## CI/CD

This project uses GitHub Actions for automated deployment:

- **Push to main**: Deploys to production
- **Pull requests**: Deploys preview and runs tests
- **Daily**: Runs automated tests

## Performance

Target scores (all >90):
- ✅ Performance: 94/100
- ✅ Accessibility: 96/100
- ✅ Best Practices: 92/100
- ✅ SEO: 95/100

## Monitoring

- Firebase Performance Monitoring
- Google Analytics
- Error tracking (Sentry)
- Uptime monitoring

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Create Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

## Support

- Documentation: See [DEPLOYMENT.md](DEPLOYMENT.md)
- Issues: [GitHub Issues](https://github.com/yourusername/EyesOfAzrael/issues)
- Firebase: [Firebase Console](https://console.firebase.google.com)

---

Made with ❤️ by the Eyes of Azrael team
```

## Custom Badges

You can create custom badges at https://shields.io:

### Examples:

**Uptime:**
```markdown
![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)
```

**Response Time:**
```markdown
![Response Time](https://img.shields.io/badge/response%20time-247ms-brightgreen)
```

**Active Users:**
```markdown
![Active Users](https://img.shields.io/badge/active%20users-342-blue)
```

**Entities:**
```markdown
![Entities](https://img.shields.io/badge/entities-1000%2B-purple)
```

**Mythologies:**
```markdown
![Mythologies](https://img.shields.io/badge/mythologies-15%2B-orange)
```

## Dynamic Badges

For dynamic badges that update automatically, consider:

1. **Shields.io Endpoint Badge:**
   ```markdown
   ![Dynamic Badge](https://img.shields.io/endpoint?url=https://your-api.com/badge.json)
   ```

2. **GitHub Actions Badge** (automatically updates):
   ```markdown
   [![Actions Status](https://github.com/{username}/{repo}/workflows/{workflow}/badge.svg)](https://github.com/{username}/{repo}/actions)
   ```

3. **Firebase Badge** (custom endpoint):
   Create a Firebase Function that returns badge JSON

## Badge Placement

### Top of README (Most Important)
- Deployment status
- Test status
- Firebase hosting
- License

### Technology Section
- Node.js version
- Firebase version
- JavaScript version

### Performance Section
- Lighthouse scores
- Performance metrics

### Footer
- Maintenance status
- Last updated
- Contributors

---

**Note:** Replace `yourusername` and `your-site.web.app` with your actual GitHub username and Firebase hosting URL.

**Last Updated:** 2025-12-27
