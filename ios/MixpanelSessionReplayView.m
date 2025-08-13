#import "MixpanelSessionReplayView.h"
#import <MixpanelSessionReplay/MixpanelSessionReplay.h>

@implementation MixpanelSessionReplayView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        _sensitive = NO;
        _shouldMarkChildrenSafe = NO;
    }
    return self;
}

- (void)setSensitive:(BOOL)sensitive {
    _sensitive = sensitive;
    _shouldMarkChildrenSafe = !sensitive;
    self.mpReplaySensitive = sensitive;
    
    if (!sensitive) {
        // Immediate attempt (may find no children due to timing)
        [self markAllChildrenAsSafe];
        
        // Delayed fallback - wait for React Native to add children
        dispatch_async(dispatch_get_main_queue(), ^{
            NSLog(@"MixpanelSessionReplayView: Delayed fallback execution - subview count: %lu", (unsigned long)self.subviews.count);
            [self markAllChildrenAsSafe];
        });
    }
}

- (void)markAllChildrenAsSafe {
    [self markAllSubviewsAsSafeRecursively:self depth:0];
}

- (void)markAllSubviewsAsSafeRecursively:(UIView *)view depth:(NSInteger)depth {
    // Prevent infinite recursion by limiting depth
    if (depth > 50) {
        NSLog(@"MixpanelSessionReplayView: Recursion depth limit reached, stopping traversal");
        return;
    }
    
    if (!view) {
        return;
    }
    
    for (UIView *subview in view.subviews) {
        if (!subview) {
            continue;
        }
        
        subview.mpReplaySensitive = NO;
        
        // Recursively handle nested MixpanelSessionReplayView components
        if ([subview isKindOfClass:[MixpanelSessionReplayView class]]) {
            MixpanelSessionReplayView *nestedView = (MixpanelSessionReplayView *)subview;
            nestedView->_sensitive = NO; // Override the internal state too
        }
        
        // Continue recursion for all subviews
        [self markAllSubviewsAsSafeRecursively:subview depth:depth + 1];
    }
}

- (void)markOnlyDirectChildrenAsSafe {
    NSLog(@"MixpanelSessionReplayView: markOnlyDirectChildrenAsSafe called - subview count: %lu", (unsigned long)self.subviews.count);
    
    // Only process direct children, with strict boundary checks
    for (UIView *child in self.subviews) {
        // Verify this child actually belongs to us
        if (child && child.superview == self) {
            child.mpReplaySensitive = NO;
            NSLog(@"MixpanelSessionReplayView: Successfully marked direct child as safe: %@", child);
            
            // Only handle nested MixpanelSessionReplayView components, don't recurse into regular views
            if ([child isKindOfClass:[MixpanelSessionReplayView class]]) {
                NSLog(@"MixpanelSessionReplayView: Found nested MixpanelSessionReplayView, overriding its state");
                MixpanelSessionReplayView *nestedView = (MixpanelSessionReplayView *)child;
                [nestedView setSensitive:NO];
            }
        }
    }
}

@end
