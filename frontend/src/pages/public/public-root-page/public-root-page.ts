import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-public-root-page',
  imports: [],
  templateUrl: './public-root-page.html',
  styleUrl: './public-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRootPage implements OnInit {
  ngOnInit(): void {
  }
}
